<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import { dark } from '@clerk/themes';

	let container: HTMLDivElement;
	let loaded = $state(false);

	onMount(() => {
		if (browser && window.Clerk) {
			if (container) {
				window.Clerk.mountUserProfile(container, {
					appearance: {
						baseTheme: dark,
						variables: {
							colorPrimary: '#6366f1', // Indigo-500
							colorBackground: '#1e293b', // Slate-800
							colorText: '#f3f4f6', // Gray-100
							colorInputBackground: '#0f172a', // Slate-900 (for contrast)
							fontFamily: 'ui-sans-serif, system-ui, sans-serif',
							borderRadius: '1rem'
						},
						elements: {
							card: 'shadow-2xl rounded-2xl',
							rootBox: 'w-full flex justify-center'
						}
					}
				});
				loaded = true;
			}
		}

		return () => {
			if (browser && window.Clerk && container) {
				try {
					window.Clerk.unmountUserProfile(container);
				} catch (e) {
					console.error('Error unmounting user profile:', e);
				}
			}
		};
	});
</script>

<div class="flex justify-center p-4">
	<div bind:this={container} class="min-h-[400px] w-full max-w-4xl">
		{#if !loaded}
			<div class="flex h-[400px] w-full animate-pulse items-center justify-center rounded-xl bg-gray-800">
				<div class="text-gray-400">Loading profile...</div>
			</div>
		{/if}
	</div>
</div>
