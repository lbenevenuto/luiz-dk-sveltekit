<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FormInput from '$lib/components/FormInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import SocialLoginButtons from '$lib/components/SocialLoginButtons.svelte';
	import { waitForClerk } from '$lib/client/clerk';
	import { normalizeRedirectPath, withBase } from '$lib/client/redirect';
	import SEO from '$lib/components/SEO.svelte';

	type Step = 'credentials' | 'second-factor';

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
	const ATTEMPT_LIMIT = 5;
	const ATTEMPT_WINDOW_MS = 60_000;
	let attemptTimestamps: number[] = [];

	const errorMessages: Record<string, string> = {
		form_identifier_not_found: 'No account found with this email',
		form_password_incorrect: 'Incorrect password',
		form_param_format_invalid: 'Invalid email format',
		session_exists: 'You are already logged in',
		form_code_incorrect: 'Incorrect verification code. Please try again.',
		form_password_pwned: 'This password has been compromised in a data breach. Please choose a different one.'
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getErrorMessage(clerkErr: any): string {
		const errorCode = clerkErr?.errors?.[0]?.code;
		const errorMessage = clerkErr?.errors?.[0]?.message;
		return errorMessages[errorCode] || errorMessage || 'An error occurred. Please try again.';
	}

	function goToRedirect(path: string) {
		return goto(withBase(path));
	}

	onMount(async () => {
		if (browser) {
			redirectUrl = normalizeRedirectPath(page.url.searchParams.get('redirect_url'));

			try {
				const clerk = await waitForClerk();
				clerkLoaded = true;
				clerkError = '';

				if (clerk.user) {
					goToRedirect(redirectUrl);
				}
			} catch (err) {
				console.error('Clerk failed to load:', err);
				clerkError = 'Authentication service is not ready. Please refresh the page.';
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

		if (browser && isRateLimited()) {
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
				await clerk.setActive({ session: result.createdSessionId });
				goToRedirect(redirectUrl);
			} else if (result.status === 'needs_second_factor') {
				// 2FA required - show second factor UI
				signInAttempt = result;

				// Determine which second factor to use
				const supportedSecondFactors = result.supportedSecondFactors || [];

				// Prefer email_code over phone_code over totp
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const emailFactor = supportedSecondFactors.find((f: any) => f.strategy === 'email_code');
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const phoneFactor = supportedSecondFactors.find((f: any) => f.strategy === 'phone_code');
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const totpFactor = supportedSecondFactors.find((f: any) => f.strategy === 'totp');

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
			error = getErrorMessage(err);
		} finally {
			recordAttempt();
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

		if (browser && isRateLimited()) {
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
				await clerk.setActive({ session: result.createdSessionId });
				goToRedirect(redirectUrl);
			} else {
				error = 'Verification failed. Please try again.';
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Second factor error:', err);
			error = getErrorMessage(err);
		} finally {
			recordAttempt();
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

	function isRateLimited(): boolean {
		const now = Date.now();
		attemptTimestamps = attemptTimestamps.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
		return attemptTimestamps.length >= ATTEMPT_LIMIT;
	}

	function recordAttempt() {
		const now = Date.now();
		attemptTimestamps = [...attemptTimestamps, now].filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
	}
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
					<div class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
					<p class="text-sm text-gray-400">Loading authentication...</p>
					{#if clerkError}
						<p class="text-sm text-red-400">{clerkError}</p>
					{/if}
				</div>
			{:else if step === 'credentials'}
				<form onsubmit={handleCredentialsSubmit} class="space-y-6">
					{#if error}
						<div
							class="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
						>
							{error}
						</div>
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
						<div
							class="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
						>
							{error}
						</div>
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
