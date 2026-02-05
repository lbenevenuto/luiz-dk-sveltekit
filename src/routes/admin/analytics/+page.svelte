<script lang="ts">
	import type { PageData } from './$types';
	import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';

	export let data: PageData;
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
			{#if data.filterUser}
				<div class="mt-2 flex items-center space-x-2">
					<p class="text-gray-600 dark:text-gray-400">
						Viewing stats for
						<span class="font-semibold text-gray-900 dark:text-white">
							{#if data.filterUser.firstName || data.filterUser.lastName}
								{data.filterUser.firstName} {data.filterUser.lastName}
							{:else}
								{data.filterUser.emailAddresses?.[0]?.emailAddress || 'Unknown User'}
							{/if}
						</span>
					</p>
					<a
						href="?days={data.days}"
						class="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						Clear Filter
					</a>
				</div>
			{:else}
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Overview of redirection activity for the last {data.days} days.
				</p>
			{/if}
		</div>
		<div class="flex items-center space-x-4">
			<a
				href="?days=7{data.filterUser ? `&userId=${data.filterUser.id}` : ''}"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 7
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>7 Days</a
			>
			<a
				href="?days=30{data.filterUser ? `&userId=${data.filterUser.id}` : ''}"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 30
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>30 Days</a
			>
			<a
				href="?days=90{data.filterUser ? `&userId=${data.filterUser.id}` : ''}"
				class="rounded-md px-3 py-2 text-sm font-medium {data.days === 90
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}"
				>90 Days</a
			>
		</div>
	</div>

	<AnalyticsDashboard {data} />
</div>
