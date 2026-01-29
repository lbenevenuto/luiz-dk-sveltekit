<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';

	let error = $state('');
	let cookiePresent = $state(false);

	onMount(async () => {
		if (!browser) return;

		try {
			console.log('OAuth callback - checking URL params...');

			// Get URL parameters to check what we received from OAuth
			const urlParams = new URLSearchParams(window.location.search);
			console.log('URL params:', Object.fromEntries(urlParams));

			console.log('Waiting for Clerk to load...');

			// Wait for Clerk script AND its load method to be available
			let attempts = 0;
			while ((!window.Clerk || !window.Clerk.load) && attempts < 100) {
				await new Promise((r) => setTimeout(r, 100));
				attempts++;
			}

			if (!window.Clerk?.load) {
				throw new Error('Clerk failed to load after 10 seconds');
			}

			console.log('Clerk available, checking if already loaded...');

			// Check if Clerk needs to be explicitly loaded
			if (!window.Clerk.client) {
				console.log('Clerk client not initialized, waiting...');
				attempts = 0;
				while (!window.Clerk.client && attempts < 100) {
					await new Promise((r) => setTimeout(r, 100));
					attempts++;
				}
			}

			console.log('Clerk client ready, checking for active signUp...');

			// Check if there's an active signUp that needs completion
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const signUp = window.Clerk.client.signUp as any;
			console.log('Active signUp:', signUp);
			console.log('SignUp status:', signUp?.status);
			console.log('Missing fields:', signUp?.missingFields);
			console.log('External account status:', signUp?.verifications?.externalAccount?.status);

			// If external account is verified, create the session
			if (signUp && signUp.verifications?.externalAccount?.status === 'verified') {
				console.log('External account verified');

				// Create the session
				try {
					const result = await signUp.update();
					console.log('SignUp update result:', result);

					if (result.createdSessionId) {
						console.log('Session created:', result.createdSessionId);
						await window.Clerk.setActive({ session: result.createdSessionId });
						console.log('Session activated, redirecting...');
						window.location.href = resolve('/');
						return;
					}
				} catch (updateErr) {
					console.error('SignUp update failed:', updateErr);
					// Continue to fallback
				}
			}

			// Check if signUp already has a created session (Clerk handled it already)
			if (signUp?.createdSessionId) {
				console.log('SignUp already has session:', signUp.createdSessionId);

				await window.Clerk.setActive({ session: signUp.createdSessionId });
				console.log('Session activated');

				console.log('Redirecting to home...');
				window.location.href = resolve('/');
				return;
			}

			// Fallback: use handleRedirectCallback
			console.log('Using handleRedirectCallback as fallback...');
			await window.Clerk.handleRedirectCallback();

			console.log('Callback handled, checking for session...');

			// Wait for session
			await new Promise((r) => setTimeout(r, 1000));

			if (window.Clerk.session) {
				console.log('Session found:', window.Clerk.session.id);
				await window.Clerk.setActive({ session: window.Clerk.session.id });

				console.log('Session activated, redirecting...');
				window.location.href = resolve('/');
			} else {
				console.error('No session after callback');
				error = 'Authentication failed. No session was created.';
				setTimeout(() => {
					window.location.href = resolve('/login');
				}, 3000);
			}
		} catch (err) {
			console.error('OAuth callback error:', err);
			error = `Error: ${err instanceof Error ? err.message : String(err)}`;
			setTimeout(() => {
				window.location.href = resolve('/login');
			}, 3000);
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-900">
	<div class="text-center">
		{#if error}
			<div class="mb-4 rounded-lg bg-red-900/50 p-4 text-red-200">
				{error}
				<p class="mt-2 text-sm">Redirecting to login...</p>
			</div>
		{:else}
			<div class="mb-4 flex justify-center">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
			</div>
			<h2 class="text-xl font-semibold text-white">Completing sign in...</h2>

			<!-- Debug Controls -->
			<div class="mt-8 rounded-lg bg-gray-800 p-4 text-left font-mono text-xs text-gray-400">
				<h3 class="mb-2 font-bold text-gray-200">Debug Info</h3>
				<p class="mb-2">Cookie status: {cookiePresent ? '✅ Present' : '❌ Missing'}</p>
				<div class="flex flex-col gap-2">
					<button onclick={() => window.location.reload()} class="rounded bg-gray-700 px-3 py-1 hover:bg-gray-600">
						Reload Page
					</button>
					<button
						onclick={() => (window.location.href = resolve('/'))}
						class="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500"
					>
						Force Redirect to Home
					</button>
					<button
						onclick={() => {
							console.log('Cookies:', document.cookie);
							alert(document.cookie);
						}}
						class="rounded bg-gray-700 px-3 py-1 hover:bg-gray-600"
					>
						Show Cookies
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
