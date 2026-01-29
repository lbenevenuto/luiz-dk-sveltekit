<script lang="ts">
	import UserProfile from '$lib/components/UserProfile.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let loading = $state(true);

	onMount(() => {
		if (browser) {
			// Simple client-side check, server-side protection is handled by hooks
			const checkAuth = setInterval(() => {
				if (window.Clerk) {
					clearInterval(checkAuth);
					loading = false;
					if (!window.Clerk.user) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						goto(resolve('/login?redirect_url=/profile' as any));
					}
				}
			}, 100);

			setTimeout(() => {
				clearInterval(checkAuth);
				loading = false;
			}, 5000);
		}
	});
</script>

<SEO title="Your Profile" description="Manage your luiz.dk account settings and profile" noindex />

<div class="py-10">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h1 class="mb-8 text-center text-3xl font-bold text-white">Your Profile</h1>

		{#if loading}
			<div class="flex justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		{:else}
			<UserProfile />
		{/if}
	</div>
</div>
