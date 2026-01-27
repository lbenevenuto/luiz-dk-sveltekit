<script lang="ts">
	import type { PageData } from './$types';
	import Chart from '$lib/components/Chart.svelte';
	import { resolve } from '$app/paths';

	export let data: PageData;
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8 items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Overview of redirection activity for the last {data.days} days.
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
			{@const dailyData = {
				labels: result.charts.daily.map((d) => d.date) || [],
				datasets: [
					{
						label: 'Clicks',
						data: result.charts.daily.map((d) => d.count) || [],
						fill: true,
						borderColor: 'rgb(59, 130, 246)',
						tension: 0.3
					}
				]
			}}

			{@const countriesData = {
				labels: result.charts.countries.map((d) => d.label) || [],
				datasets: [
					{
						label: 'Clicks',
						data: result.charts.countries.map((d) => d.value) || [],
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)'
						]
					}
				]
			}}

			{@const browserData = {
				labels: result.charts.browsers.map((d) => d.label) || [],
				datasets: [
					{
						data: result.charts.browsers.map((d) => d.value) || [],
						backgroundColor: [
							'rgba(54, 162, 235, 0.8)',
							'rgba(255, 159, 64, 0.8)',
							'rgba(75, 192, 192, 0.8)',
							'rgba(255, 205, 86, 0.8)',
							'rgba(201, 203, 207, 0.8)'
						]
					}
				]
			}}

			<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Daily Clicks -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Daily Clicks</h3>
					<div class="h-80 w-full">
						<Chart type="line" data={dailyData} options={{ responsive: true, maintainAspectRatio: false }} />
					</div>
				</div>

				<!-- Top Countries -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Top Countries</h3>
					<div class="h-80 w-full">
						<Chart
							type="bar"
							data={countriesData}
							options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }}
						/>
					</div>
				</div>

				<!-- Browser Distribution -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Browsers</h3>
					<div class="flex h-64 justify-center">
						<Chart type="doughnut" data={browserData} options={{ responsive: true, maintainAspectRatio: false }} />
					</div>
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
											<a
												href={resolve('/s/[shortCode]', { shortCode: row.shortCode })}
												target="_blank"
												class="hover:underline">{row.shortCode}</a
											>
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
