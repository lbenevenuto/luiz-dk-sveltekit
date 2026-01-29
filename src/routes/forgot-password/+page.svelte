<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FormInput from '$lib/components/FormInput.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';

	type Step = 'email' | 'code' | 'password' | 'success';

	let step = $state<Step>('email');
	let email = $state('');
	let resetCode = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let clerkLoaded = $state(false);
	let error = $state('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let signInAttempt = $state<any>(null);
	const ATTEMPT_LIMIT = 5;
	const ATTEMPT_WINDOW_MS = 60_000;
	let attemptTimestamps: number[] = [];

	const errorMessages: Record<string, string> = {
		form_identifier_not_found: 'No account found with this email',
		form_param_format_invalid: 'Invalid email format',
		form_code_incorrect: 'Incorrect reset code. Please try again.',
		form_password_pwned: 'This password has been compromised in a data breach. Please choose a different one.',
		form_password_length_too_short: 'Password must be at least 8 characters'
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getErrorMessage(clerkError: any): string {
		const errorCode = clerkError?.errors?.[0]?.code;
		const errorMessage = clerkError?.errors?.[0]?.message;
		return errorMessages[errorCode] || errorMessage || 'An error occurred. Please try again.';
	}

	// Clear error when user types
	$effect(() => {
		if (email || resetCode || newPassword || confirmPassword) {
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

	async function handleEmailSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		if (browser && isRateLimited()) {
			error = 'Too many attempts. Please wait 60 seconds and try again.';
			return;
		}

		if (!window.Clerk) {
			error = 'Authentication service not ready. Please refresh.';
			return;
		}

		loading = true;

		try {
			// Create a sign-in attempt to initiate password reset
			const signIn = await window.Clerk.client.signIn.create({
				identifier: email
			});

			// Find the reset_password_email_code factor to get the email_address_id
			const resetFactor = signIn.supportedFirstFactors?.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(factor: any) => factor.strategy === 'reset_password_email_code'
			);

			if (!resetFactor?.emailAddressId) {
				error = 'Password reset not available for this account';
				return;
			}

			// Request password reset code with email_address_id
			await signIn.prepareFirstFactor({
				strategy: 'reset_password_email_code',
				emailAddressId: resetFactor.emailAddressId
			});

			signInAttempt = signIn;
			step = 'code';
		} catch (err) {
			error = getErrorMessage(err);
		} finally {
			recordAttempt();
			loading = false;
		}
	}

	async function handleCodeSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!resetCode) {
			error = 'Please enter the reset code';
			return;
		}

		// Just validate and move to password step
		// We'll attempt the reset when they submit the new password
		step = 'password';
	}

	async function handlePasswordSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!newPassword || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (newPassword.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (browser && isRateLimited()) {
			error = 'Too many attempts. Please wait 60 seconds and try again.';
			return;
		}

		loading = true;

		try {
			if (!window.Clerk) {
				error = 'Authentication service not ready. Please refresh.';
				return;
			}

			// Attempt to reset password with code and new password
			const result = await signInAttempt.attemptFirstFactor({
				strategy: 'reset_password_email_code',
				code: resetCode,
				password: newPassword
			});

			if (result.status === 'complete') {
				// Automatically sign in the user with new password
				await window.Clerk.setActive({ session: result.createdSessionId });
				step = 'success';

				// Redirect after 2 seconds
				setTimeout(() => {
					goto(resolve('/'));
				}, 2000);
			} else {
				error = 'Password reset incomplete. Please try again.';
			}
		} catch (err) {
			error = getErrorMessage(err);
		} finally {
			recordAttempt();
			loading = false;
		}
	}

	async function handleResendCode() {
		error = '';
		loading = true;

		try {
			// Find the reset_password_email_code factor to get the email_address_id
			const resetFactor = signInAttempt.supportedFirstFactors?.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(factor: any) => factor.strategy === 'reset_password_email_code'
			);

			if (!resetFactor?.emailAddressId) {
				error = 'Password reset not available for this account';
				return;
			}

			await signInAttempt.prepareFirstFactor({
				strategy: 'reset_password_email_code',
				emailAddressId: resetFactor.emailAddressId
			});
			// Show success feedback (you could add a success message state)
		} catch (err) {
			error = getErrorMessage(err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - luiz.dk</title>
	<meta name="description" content="Reset your password for luiz.dk" />
</svelte:head>

<div class="flex min-h-full items-center justify-center py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-white">
				{#if step === 'email'}
					Reset Password
				{:else if step === 'code'}
					Check Your Email
				{:else if step === 'password'}
					Create New Password
				{:else}
					Password Reset Complete
				{/if}
			</h1>
			<p class="mt-2 text-sm text-gray-400">
				{#if step === 'email'}
					Enter your email to receive a reset code
				{:else if step === 'code'}
					We sent a 6-digit code to {email}
				{:else if step === 'password'}
					Enter your new password
				{:else}
					Your password has been successfully reset
				{/if}
			</p>
		</div>

		<div class="rounded-2xl bg-gray-800 p-8 shadow-2xl">
			{#if !clerkLoaded}
				<!-- Loading state -->
				<div class="flex flex-col items-center space-y-4">
					<div class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
					<p class="text-sm text-gray-400">Loading...</p>
				</div>
			{:else if step === 'email'}
				<!-- Step 1: Email input -->
				<form onsubmit={handleEmailSubmit} class="space-y-6">
					<FormInput
						type="email"
						label="Email Address"
						bind:value={email}
						placeholder="you@example.com"
						required={true}
						disabled={loading}
						autocomplete="email"
					/>

					<SubmitButton {loading} text="Send Reset Code" loadingText="Sending..." disabled={!email} />
				</form>
			{:else if step === 'code'}
				<!-- Step 2: Verification code -->
				<form onsubmit={handleCodeSubmit} class="space-y-6">
					<FormInput
						type="text"
						label="Reset Code"
						bind:value={resetCode}
						placeholder="000000"
						required={true}
						disabled={loading}
						autocomplete="one-time-code"
					/>

					<div class="text-center text-sm">
						<button
							type="button"
							onclick={handleResendCode}
							disabled={loading}
							class="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
						>
							Didn't receive the code? Resend
						</button>
					</div>

					<SubmitButton
						{loading}
						text="Continue"
						loadingText="Verifying..."
						disabled={!resetCode || resetCode.length < 6}
					/>
				</form>
			{:else if step === 'password'}
				<!-- Step 3: New password -->
				<form onsubmit={handlePasswordSubmit} class="space-y-6">
					<FormInput
						type="password"
						label="New Password"
						bind:value={newPassword}
						placeholder="••••••••"
						required={true}
						disabled={loading}
						autocomplete="new-password"
					/>

					<FormInput
						type="password"
						label="Confirm Password"
						bind:value={confirmPassword}
						placeholder="••••••••"
						required={true}
						disabled={loading}
						autocomplete="new-password"
					/>

					<SubmitButton
						{loading}
						text="Reset Password"
						loadingText="Resetting..."
						disabled={!newPassword || !confirmPassword}
					/>
				</form>
			{:else}
				<!-- Step 4: Success -->
				<div class="space-y-6 text-center">
					<div class="text-6xl">✅</div>
					<p class="text-lg text-gray-300">Your password has been reset successfully!</p>
					<p class="text-sm text-gray-400">Redirecting you to the home page...</p>
				</div>
			{/if}

			{#if error}
				<div
					class="mt-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
				>
					{error}
				</div>
			{/if}
		</div>

		{#if step === 'email'}
			<p class="mt-4 text-center text-sm text-gray-400">
				Remember your password?
				<a href={resolve('/login')} class="text-indigo-400 hover:text-indigo-300"> Back to login </a>
			</p>
		{/if}
	</div>
</div>
