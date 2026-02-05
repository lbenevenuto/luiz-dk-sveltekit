<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	// We need to typecase the hrefs to make `resolve` happy with literal types
	const tabs = [
		{ name: 'Analytics', href: '/admin/analytics' as const },
		{ name: 'Users', href: '/admin/users' as const }
	];

	function isCurrent(href: string) {
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Admin Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">Manage users and view global analytics.</p>
	</div>

	<!-- Tabs -->
	<div class="mb-8 border-b border-gray-200 dark:border-gray-700">
		<nav class="-mb-px flex space-x-8" aria-label="Tabs">
			{#each tabs as tab (tab.href)}
				<a
					href={resolve(tab.href)}
					class="border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap {isCurrent(tab.href)
						? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-300 dark:hover:text-gray-300'}"
					aria-current={isCurrent(tab.href) ? 'page' : undefined}
				>
					{tab.name}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Content -->
	{@render children()}
</div>
