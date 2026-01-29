<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { waitForClerk } from '$lib/client/clerk';
	import { normalizeRedirectPath } from '$lib/client/redirect';

	let error = $state('');
	let redirectTo = $state('/');

	onMount(async () => {
		if (!browser) return;

		const urlParams = new URLSearchParams(window.location.search);
		redirectTo = normalizeRedirectPath(urlParams.get('redirect_url'));

		try {
			const clerk = await waitForClerk();
			await clerk.handleRedirectCallback();

			const sessionId = clerk.session?.id;
			if (sessionId) {
				await clerk.setActive({ session: sessionId });
				window.location.href = resolve(redirectTo as any);
				return;
			}

			if (clerk.user) {
				window.location.href = resolve(redirectTo as any);
				return;
			}

			error = 'Authentication failed. No session was created.';
			setTimeout(() => {
				window.location.href = resolve('/login');
			}, 3000);
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
		{/if}
	</div>
</div>
