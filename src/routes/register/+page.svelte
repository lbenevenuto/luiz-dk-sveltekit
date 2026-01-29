<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FormInput from '$lib/components/FormInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import SocialLoginButtons from '$lib/components/SocialLoginButtons.svelte';

	type Step = 'form' | 'verify';

	let step = $state<Step>('form');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let verificationCode = $state('');
	let loading = $state(false);
	let clerkLoaded = $state(false);
	let error = $state('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let signUpAttempt = $state<any>(null);

	const errorMessages: Record<string, string> = {
		form_identifier_exists: 'An account with this email already exists',
		form_password_pwned: 'This password has been compromised in a data breach. Please choose a different one.',
		form_param_format_invalid: 'Invalid email format',
		form_password_length_too_short: 'Password must be at least 8 characters',
		form_code_incorrect: 'Incorrect verification code. Please try again.'
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getErrorMessage(clerkError: any): string {
		const errorCode = clerkError?.errors?.[0]?.code;
		const errorMessage = clerkError?.errors?.[0]?.message;
		return errorMessages[errorCode] || errorMessage || 'An error occurred. Please try again.';
	}

	onMount(async () => {
		if (browser) {
			// Wait for Clerk to load
			const checkClerk = setInterval(() => {
				if (window.Clerk) {
					clearInterval(checkClerk);
					clerkLoaded = true;

					// Redirect if already logged in
					if (window.Clerk.user) {
						goto(resolve('/'));
					}
				}
			}, 100);

			// Timeout after 10 seconds
			setTimeout(() => clearInterval(checkClerk), 10000);
		}
	});

	async function handleSignUp(e: Event) {
		e.preventDefault();
		error = '';

		// Client-side validation
		if (!email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		// Password validation
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (!window.Clerk) {
			error = 'Authentication service is not ready. Please refresh the page.';
			return;
		}

		loading = true;

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const params: any = {
				emailAddress: email,
				password
			};

			const result = await window.Clerk.client.signUp.create(params);

			signUpAttempt = result;

			// Prepare email verification
			await result.prepareEmailAddressVerification({ strategy: 'email_code' });

			// Move to verification step
			step = 'verify';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Sign up error:', err);
			error = getErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	async function handleVerifyEmail(e: Event) {
		e.preventDefault();
		error = '';

		if (!verificationCode) {
			error = 'Please enter the verification code';
			return;
		}

		if (verificationCode.length !== 6) {
			error = 'Verification code must be 6 digits';
			return;
		}

		if (!signUpAttempt) {
			error = 'No sign up attempt found. Please start over.';
			return;
		}

		loading = true;

		try {
			const result = await signUpAttempt.attemptEmailAddressVerification({
				code: verificationCode
			});

			if (result.status === 'complete') {
				await window.Clerk?.setActive({ session: result.createdSessionId });
				goto(resolve('/'));
			} else {
				error = 'Verification failed. Please try again.';
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Verification error:', err);
			error = getErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	async function handleResendCode() {
		if (!signUpAttempt) return;

		loading = true;
		error = '';

		try {
			await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
			error = '';
			// Show success message temporarily
			error = 'Verification code sent! Check your email.';
			setTimeout(() => {
				if (error === 'Verification code sent! Check your email.') {
					error = '';
				}
			}, 3000);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error('Resend code error:', err);
			error = getErrorMessage(err);
		} finally {
			loading = false;
		}
	}

	// Clear error when user types
	$effect(() => {
		if (email || password || confirmPassword || verificationCode) {
			error = '';
		}
	});
</script>

<svelte:head>
	<title>Register - luiz.dk</title>
	<meta name="description" content="Create your luiz.dk account" />
</svelte:head>

<div class="flex min-h-full items-center justify-center py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-white">
				{step === 'form' ? 'Create Account' : 'Verify Email'}
			</h1>
			<p class="mt-2 text-sm text-gray-400">
				{step === 'form' ? 'Join luiz.dk today' : 'Enter the code sent to your email'}
			</p>
		</div>

		<div class="rounded-2xl bg-gray-800 p-8 shadow-2xl">
			{#if !clerkLoaded}
				<div class="flex flex-col items-center space-y-4">
					<div class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
					<p class="text-sm text-gray-400">Loading authentication...</p>
				</div>
			{:else if step === 'form'}
				<form onsubmit={handleSignUp} class="space-y-6">
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
						placeholder="At least 8 characters"
						required
						disabled={loading}
						autocomplete="new-password"
					/>

					<FormInput
						type="password"
						label="Confirm Password"
						bind:value={confirmPassword}
						placeholder="Re-enter your password"
						required
						disabled={loading}
						autocomplete="new-password"
					/>

					<SubmitButton {loading} text="Create Account" loadingText="Creating account..." />

					<SocialLoginButtons {loading} />
				</form>
			{:else}
				<!-- Verification Step -->
				<form onsubmit={handleVerifyEmail} class="space-y-6">
					{#if error}
						<div
							class="rounded-lg border-2 p-4 {error.startsWith('Verification code sent')
								? 'border-green-200 bg-green-50 text-green-600 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400'
								: 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400'}"
						>
							{error}
						</div>
					{/if}

					<div class="rounded-lg bg-gray-900 p-4">
						<p class="text-sm text-gray-300">We've sent a 6-digit verification code to:</p>
						<p class="mt-1 font-medium text-white">{email}</p>
					</div>

					<FormInput
						type="text"
						label="Verification Code"
						bind:value={verificationCode}
						placeholder="000000"
						required
						disabled={loading}
						autocomplete="one-time-code"
					/>

					<SubmitButton {loading} text="Verify Email" loadingText="Verifying..." />

					<div class="text-center">
						<button
							type="button"
							onclick={handleResendCode}
							disabled={loading}
							class="text-sm text-indigo-400 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Resend code
						</button>
					</div>
				</form>
			{/if}
		</div>

		<p class="mt-4 text-center text-sm text-gray-400">
			Already have an account?
			<a href={resolve('/login')} class="text-indigo-400 hover:text-indigo-300">Sign in</a>
		</p>
	</div>
</div>
