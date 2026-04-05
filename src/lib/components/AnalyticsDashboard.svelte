<script lang="ts">
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DoughnutChart from '$lib/components/charts/DoughnutChart.svelte';

	interface AnalyticsItem {
		id: string;
		timestamp: string;
		shortCode: string;
		country: string;
		referrer: string;
		userAgent: string;
	}

	interface Props {
		data: {
			streamed: {
				analytics: Promise<{
					analytics: AnalyticsItem[];
					charts?: {
						daily: { date: string; count: number }[];
						countries: { label: string; value: number }[];
						browsers: { label: string; value: number }[];
						referrers: { label: string; value: number }[];
					};
					error?: string;
				}>;
			};
			days: number;
		};
	}

	let { data }: Props = $props();
</script>

<div>
	{#await data.streamed.analytics}
		<div
			class="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex flex-col items-center space-y-4">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
				<p class="text-gray-500 dark:text-gray-400">Loading analytics...</p>
			</div>
		</div>
	{:then result}
		{#if result.error}
			<div
				class="relative mb-8 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
				role="alert"
			>
				<span class="block sm:inline">{result.error}</span>
			</div>
		{/if}

		<!-- Charts Section -->
		{#if !result.error && result.charts}
			<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Daily Clicks -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Daily Clicks</h3>
					{#if result.charts.daily.length > 0}
						<div class="h-80 w-full">
							<LineChart data={result.charts.daily} />
						</div>
					{:else}
						<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No click data available.</p>
					{/if}
				</div>

				<!-- Top Countries -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Top Countries</h3>
					{#if result.charts.countries.length > 0}
						<div class="h-80 w-full">
							<BarChart data={result.charts.countries} />
						</div>
					{:else}
						<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No country data available.</p>
					{/if}
				</div>

				<!-- Browser Distribution -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Browsers</h3>
					{#if result.charts.browsers.length > 0}
						<div class="flex h-64 justify-center">
							<DoughnutChart data={result.charts.browsers} />
						</div>
					{:else}
						<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No browser data available.</p>
					{/if}
				</div>

				<!-- Referrers List (Text based as it can be long) -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Top Referrers</h3>
					<ul class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each result.charts.referrers as referrer (referrer.label)}
							<li class="flex justify-between py-3">
								<span class="text-gray-700 dark:text-gray-300">{referrer.label}</span>
								<span class="font-medium text-gray-900 dark:text-white">{referrer.value}</span>
							</li>
						{/each}
						{#if result.charts.referrers.length === 0}
							<li class="py-3 text-sm text-gray-500">No referrer data available.</li>
						{/if}
					</ul>
				</div>
			</div>
		{/if}

		<!-- Detailed Data Table -->
		<div class="mt-8">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Recent Activity Log</h2>
			{#if !result.error && result.analytics.length > 0}
				<div
					class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead class="bg-gray-50 dark:bg-gray-700/50">
								<tr>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>Time</th
									>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>Short Code</th
									>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>Country</th
									>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>Referrer</th
									>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>User Agent</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
								{#each result.analytics as row (row.id)}
									<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
											{new Date(row.timestamp).toLocaleString()}
										</td>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-blue-600 dark:text-blue-400">
											<a href={`/s/${row.shortCode}`} target="_blank" class="hover:underline">{row.shortCode}</a>
										</td>
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
											{row.country || 'Unknown'}
										</td>
										<td
											class="max-w-xs truncate px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
											title={row.referrer}
										>
											{row.referrer || '-'}
										</td>
										<td
											class="max-w-xs truncate px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
											title={row.userAgent}
										>
											{row.userAgent || '-'}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else if !result.error}
				<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No analytics data</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						No redirects have been recorded in the last {data.days} days.
					</p>
				</div>
			{/if}
		</div>
	{:catch error}
		<div
			class="relative mb-8 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
			role="alert"
		>
			<span class="block sm:inline">An error occurred: {error.message}</span>
		</div>
	{/await}
</div>
