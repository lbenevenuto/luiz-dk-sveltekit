<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FormInput from '$lib/components/FormInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import SocialLoginButtons from '$lib/components/SocialLoginButtons.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import { waitForClerk } from '$lib/client/clerk';
	import { normalizeRedirectPath, withBase } from '$lib/client/redirect';
	import { getClerkErrorMessage } from '$lib/client/clerk-errors';
	import { createClientRateLimiter } from '$lib/client/rate-limit';
	import SEO from '$lib/components/SEO.svelte';

	type Step = 'credentials' | 'second-factor';
	type EmailFactor = Extract<ClerkSupportedSecondFactor, { strategy: 'email_code' }>;
	type PhoneFactor = Extract<ClerkSupportedSecondFactor, { strategy: 'phone_code' }>;
	type TotpFactor = Extract<ClerkSupportedSecondFactor, { strategy: 'totp' }>;

	let step = $state<Step>('credentials');
	let email = $state('');
	let password = $state('');
	let secondFactorCode = $state('');
	let loading = $state(false);
	let clerkLoaded = $state(false);
	let clerkError = $state('');
	let error = $state('');
	let redirectUrl = $state('/');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let signInAttempt = $state<any>(null);
	let secondFactorStrategy = $state<string>('');
	const rateLimiter = createClientRateLimiter();

	function goToRedirect(path: string) {
		return goto(withBase(path));
	}

	function isEmailFactor(factor: ClerkSupportedSecondFactor): factor is EmailFactor {
		return factor.strategy === 'email_code';
	}

	function isPhoneFactor(factor: ClerkSupportedSecondFactor): factor is PhoneFactor {
		return factor.strategy === 'phone_code';
	}

	function isTotpFactor(factor: ClerkSupportedSecondFactor): factor is TotpFactor {
		return factor.strategy === 'totp';
	}

	onMount(async () => {
		if (browser) {
			redirectUrl = normalizeRedirectPath(page.url.searchParams.get('redirect_url'));

			if (!page.data.clerkPublishableKey || !page.data.clerkFrontendApi) {
				clerkError = 'Authentication is not configured for this environment.';
				return;
			}

			try {
				const clerk = await waitForClerk();
				clerkLoaded = true;
				clerkError = '';

				if (clerk.user) {
					goToRedirect(redirectUrl);
				}
			} catch (err) {
				console.error('Clerk failed to load:', err);
				clerkError = 'Authentication failed to initialize. Check Clerk production keys and frontend API.';
			}
		}
	});

	async function handleCredentialsSubmit(e: Event) {
		e.preventDefault();
		error = '';

		// Client-side validation
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		if (browser && rateLimiter.isRateLimited()) {
			error = 'Too many attempts. Please wait 60 seconds and try again.';
			return;
		}

		loading = true;

		try {
			const clerk = await waitForClerk();
			// Step 1: Create sign-in attempt with identifier
			const signIn = await clerk.client.signIn.create({
				identifier: email
			});

			// Step 2: Attempt first factor (password)
			const result = await signIn.attemptFirstFactor({
				strategy: 'password',
				password
			});

			if (result.status === 'complete') {
				// No 2FA - sign in complete
				if (!result.createdSessionId) {
					error = 'Sign in failed. Please try again.';
					return;
				}
				await clerk.setActive({ session: result.createdSessionId });
				goToRedirect(redirectUrl);
			} else if (result.status === 'needs_second_factor') {
				// 2FA required - show second factor UI
				signInAttempt = result;

				// Determine which second factor to use
				const supportedSecondFactors = result.supportedSecondFactors || [];

				// Prefer email_code over phone_code over totp
				const emailFactor = supportedSecondFactors.find(isEmailFactor);
				const phoneFactor = supportedSecondFactors.find(isPhoneFactor);
				const totpFactor = supportedSecondFactors.find(isTotpFactor);

				if (emailFactor) {
					secondFactorStrategy = 'email_code';
					// Prepare email code
					await result.prepareSecondFactor({
						strategy: 'email_code',
						emailAddressId: emailFactor.emailAddressId
					});
				} else if (phoneFactor) {
					secondFactorStrategy = 'phone_code';
					// Prepare phone code
					await result.prepareSecondFactor({
						strategy: 'phone_code',
						phoneNumberId: phoneFactor.phoneNumberId
					});
				} else if (totpFactor) {
					secondFactorStrategy = 'totp';
					// TOTP doesn't need preparation
				} else {
					error = 'Two-factor authentication is required but no supported method found';
					return;
				}

				step = 'second-factor';
			} else {
				error = 'Sign in failed. Please try again.';
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Sign in error:', err);
			error = getClerkErrorMessage(err);
		} finally {
			rateLimiter.recordAttempt();
			loading = false;
		}
	}

	async function handleSecondFactorSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!secondFactorCode) {
			error = 'Please enter the verification code';
			return;
		}

		if (!signInAttempt) {
			error = 'Authentication service error. Please refresh.';
			return;
		}

		if (browser && rateLimiter.isRateLimited()) {
			error = 'Too many attempts. Please wait 60 seconds and try again.';
			return;
		}

		loading = true;

		try {
			const clerk = await waitForClerk();
			const result = await signInAttempt.attemptSecondFactor({
				strategy: secondFactorStrategy,
				code: secondFactorCode
			});

			if (result.status === 'complete') {
				if (!result.createdSessionId) {
					error = 'Verification failed. Please try again.';
					return;
				}
				await clerk.setActive({ session: result.createdSessionId });
				goToRedirect(redirectUrl);
			} else {
				error = 'Verification failed. Please try again.';
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Second factor error:', err);
			error = getClerkErrorMessage(err);
		} finally {
			rateLimiter.recordAttempt();
			loading = false;
		}
	}

	function getSecondFactorMessage(): string {
		if (secondFactorStrategy === 'email_code') {
			return `We sent a verification code to your email`;
		} else if (secondFactorStrategy === 'phone_code') {
			return `We sent a verification code to your phone`;
		} else if (secondFactorStrategy === 'totp') {
			return `Enter the code from your authenticator app`;
		}
		return 'Enter your verification code';
	}

	// Clear error when user types
	$effect(() => {
		if (email || password || secondFactorCode) {
			error = '';
		}
	});
</script>

<SEO title="Login" description="Sign in to your luiz.dk account" noindex />

<div class="flex min-h-full items-center justify-center py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-white">
				{#if step === 'credentials'}
					Sign In
				{:else}
					Verify Your Identity
				{/if}
			</h1>
			<p class="mt-2 text-sm text-gray-400">
				{#if step === 'credentials'}
					Welcome back to luiz.dk
				{:else}
					{getSecondFactorMessage()}
				{/if}
			</p>
		</div>

		<div class="rounded-2xl bg-gray-800 p-8 shadow-2xl">
			{#if !clerkLoaded}
				<div class="flex flex-col items-center space-y-4">
					<LoadingSpinner class="border-t-2 border-b-2 border-indigo-500" />
					<p class="text-sm text-gray-400">Loading authentication...</p>
					{#if clerkError}
						<p class="text-sm text-red-400">{clerkError}</p>
					{/if}
				</div>
			{:else if step === 'credentials'}
				<form onsubmit={handleCredentialsSubmit} class="space-y-6">
					{#if error}
						<ErrorAlert message={error} />
					{/if}

					<FormInput
						type="email"
						label="Email"
						bind:value={email}
						placeholder="you@example.com"
						required
						disabled={loading}
						autocomplete="email"
					/>

					<FormInput
						type="password"
						label="Password"
						bind:value={password}
						placeholder="Enter your password"
						required
						disabled={loading}
						autocomplete="current-password"
					/>

					<SubmitButton {loading} text="Sign In" loadingText="Signing in..." />

					<SocialLoginButtons {loading} redirectTo={redirectUrl} />

					<div class="text-center">
						<a href={resolve('/forgot-password')} class="text-sm text-indigo-400 hover:text-indigo-300">
							Forgot password?
						</a>
					</div>
				</form>
			{:else}
				<!-- Second factor step -->
				<form onsubmit={handleSecondFactorSubmit} class="space-y-6">
					{#if error}
						<ErrorAlert message={error} class="text-sm" />
					{/if}

					<FormInput
						type="text"
						label="Verification Code"
						bind:value={secondFactorCode}
						placeholder="000000"
						required={true}
						disabled={loading}
						autocomplete="one-time-code"
					/>

					<SubmitButton
						{loading}
						text="Verify & Sign In"
						loadingText="Verifying..."
						disabled={!secondFactorCode || secondFactorCode.length < 6}
					/>

					<div class="text-center">
						<button
							type="button"
							onclick={() => {
								step = 'credentials';
								secondFactorCode = '';
								error = '';
							}}
							class="text-sm text-indigo-400 hover:text-indigo-300"
						>
							Back to login
						</button>
					</div>
				</form>
			{/if}
		</div>

		<p class="mt-4 text-center text-sm text-gray-400">
			Don't have an account?
			<a href={resolve('/register')} class="text-indigo-400 hover:text-indigo-300">Sign up</a>
		</p>
	</div>
</div>
