<script lang="ts">
	import type { PageData } from './$types';
	import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';

	export let data: PageData;
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8 items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Overview of your link activity for the last {data.days} days.
			</p>
		</div>
		<div class="flex items-center space-x-4">
			<a
				href="?days=7"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 7
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>7 Days</a
			>
			<a
				href="?days=30"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 30
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>30 Days</a
			>
			<a
				href="?days=90"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 90
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>90 Days</a
			>
		</div>
	</div>

	<AnalyticsDashboard {data} />
</div>
