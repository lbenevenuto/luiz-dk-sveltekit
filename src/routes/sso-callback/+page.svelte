<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { waitForClerk } from '$lib/client/clerk';
	import { normalizeRedirectPath, withBase } from '$lib/client/redirect';

	let error = $state('');
	let redirectTo = $state('/');
	const SESSION_WAIT_TIMEOUT_MS = 4000;
	const SESSION_POLL_INTERVAL_MS = 200;

	function redirectNow(path: string) {
		window.location.replace(withBase(path));
	}

	async function waitForSession(
		clerk: Awaited<ReturnType<typeof waitForClerk>>,
		timeoutMs: number = SESSION_WAIT_TIMEOUT_MS
	): Promise<boolean> {
		const startedAt = Date.now();

		while (Date.now() - startedAt < timeoutMs) {
			if (clerk.session?.id || clerk.user) {
				return true;
			}
			await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL_MS));
		}

		return false;
	}

	onMount(async () => {
		if (!browser) return;

		const urlParams = new URLSearchParams(window.location.search);
		redirectTo = normalizeRedirectPath(urlParams.get('redirect_url'));

		try {
			const clerk = await waitForClerk();
			await clerk.handleRedirectCallback();

			// Session/user can take a moment to hydrate after OAuth callback.
			const hasSession = await waitForSession(clerk);
			if (hasSession) {
				const sessionId = clerk.session?.id;
				if (sessionId) {
					await clerk.setActive({ session: sessionId });
				}
				redirectNow(redirectTo);
				return;
			}

			error = 'Authentication failed. No session was created.';
			setTimeout(() => {
				redirectNow('/login');
			}, 3000);
		} catch (err) {
			console.error('OAuth callback error:', err);
			// If callback handling throws due to timing/race, check session once before surfacing an error.
			try {
				const clerk = await waitForClerk();
				const hasSession = await waitForSession(clerk);
				if (hasSession) {
					redirectNow(redirectTo);
					return;
				}
			} catch {
				// ignore secondary failure and show original error
			}

			error = `Error: ${err instanceof Error ? err.message : String(err)}`;
			setTimeout(() => redirectNow('/login'), 3000);
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
		{/if}
	</div>
</div>
