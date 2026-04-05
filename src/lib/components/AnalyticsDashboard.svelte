<script lang="ts">
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DoughnutChart from '$lib/components/charts/DoughnutChart.svelte';
	import { formatDate } from '$lib/utils/date';
	import {
		createTable,
		FlexRender,
		getCoreRowModel,
		type ColumnDef,
		type PaginationState,
		type Updater
	} from '@tanstack/svelte-table';

	interface Props {
		data: {
			streamed: {
				charts: Promise<{
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
			filterUser?: { id: string } | null;
		};
	}

	interface LogRow {
		id: string;
		timestamp: string;
		shortCode: string;
		country: string;
		referrer: string;
		userAgent: string;
	}

	interface LogData {
		rows: LogRow[];
		totalRows: number;
		page: number;
		pageSize: number;
		totalPages: number;
		error?: string;
	}

	const PAGE_SIZES = [5, 10, 50, 100] as const;

	let { data }: Props = $props();

	let logData = $state<LogData | null>(null);
	let logLoading = $state(false);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const columns: ColumnDef<LogRow>[] = [
		{
			accessorKey: 'timestamp',
			header: 'Time',
			cell: (info) => formatDate(info.getValue<string>())
		},
		{
			accessorKey: 'shortCode',
			header: 'Short Code'
		},
		{
			accessorKey: 'country',
			header: 'Country',
			cell: (info) => info.getValue<string>() || 'Unknown'
		},
		{
			accessorKey: 'referrer',
			header: 'Referrer',
			cell: (info) => info.getValue<string>() || '-'
		},
		{
			accessorKey: 'userAgent',
			header: 'User Agent',
			cell: (info) => info.getValue<string>() || '-'
		}
	];

	function setPagination(updater: Updater<PaginationState>) {
		pagination = updater instanceof Function ? updater(pagination) : updater;
		fetchLog();
	}

	const table = createTable({
		get data() {
			return logData?.rows ?? [];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		get rowCount() {
			return logData?.totalRows ?? 0;
		},
		state: {
			get pagination() {
				return pagination;
			}
		},
		onPaginationChange: setPagination
	});

	let fetchId = 0;

	async function fetchLog() {
		const currentFetchId = ++fetchId;
		logLoading = true;
		try {
			const entries: [string, string][] = [
				['days', String(data.days)],
				['page', String(pagination.pageIndex + 1)],
				['pageSize', String(pagination.pageSize)]
			];
			const userId = data.filterUser?.id;
			if (userId) entries.push(['userId', userId]);
			const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

			const res = await fetch(`/api/v1/analytics-log?${qs}`);
			if (currentFetchId !== fetchId) return;
			if (res.ok) {
				logData = await res.json();
			} else {
				logData = {
					rows: [],
					totalRows: 0,
					page: 1,
					pageSize: pagination.pageSize,
					totalPages: 0,
					error: 'Failed to load'
				};
			}
		} catch {
			if (currentFetchId !== fetchId) return;
			logData = {
				rows: [],
				totalRows: 0,
				page: 1,
				pageSize: pagination.pageSize,
				totalPages: 0,
				error: 'Failed to load'
			};
		} finally {
			if (currentFetchId === fetchId) {
				logLoading = false;
			}
		}
	}

	// Derive a key that changes when days or userId changes, triggering a refetch
	let lastFetchKey = $state('');
	const fetchKey = $derived(`${data.days}:${data.filterUser?.id ?? ''}`);

	$effect(() => {
		if (fetchKey !== lastFetchKey) {
			lastFetchKey = fetchKey;
			pagination = { pageIndex: 0, pageSize: pagination.pageSize };
			fetchLog();
		}
	});
</script>

<div>
	{#await data.streamed.charts}
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
	{:catch error}
		<div
			class="relative mb-8 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
			role="alert"
		>
			<span class="block sm:inline">An error occurred: {error.message}</span>
		</div>
	{/await}

	<!-- Activity Log (fetched client-side) -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Recent Activity Log</h2>

		{#if logLoading && !logData}
			<div
				class="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="flex items-center gap-3">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
					<p class="text-sm text-gray-500 dark:text-gray-400">Loading activity log...</p>
				</div>
			</div>
		{:else if logData?.error}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-400"
			>
				{logData.error}
			</div>
		{:else if logData && logData.rows.length > 0}
			<div
				class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
				class:opacity-60={logLoading}
			>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead class="bg-gray-50 dark:bg-gray-700/50">
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<tr>
									{#each headerGroup.headers as header (header.id)}
										<th
											scope="col"
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
										>
											{#if !header.isPlaceholder}
												<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
											{/if}
										</th>
									{/each}
								</tr>
							{/each}
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
							{#each table.getRowModel().rows as row (row.id)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
									{#each row.getVisibleCells() as cell (cell.id)}
										{@const colId = cell.column.id}
										<td
											class="{colId === 'referrer' || colId === 'userAgent'
												? 'max-w-xs truncate'
												: 'whitespace-nowrap'} px-6 py-4 text-sm {colId === 'shortCode'
												? 'font-medium text-blue-600 dark:text-blue-400'
												: colId === 'country'
													? 'text-gray-900 dark:text-white'
													: 'text-gray-500 dark:text-gray-400'}"
											title={colId === 'referrer' || colId === 'userAgent' ? String(cell.getValue() ?? '') : undefined}
										>
											{#if colId === 'shortCode'}
												<a
													href={`/s/${cell.getValue()}`}
													target="_blank"
													rel="noopener noreferrer"
													class="hover:underline">{cell.getValue()}</a
												>
											{:else}
												<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="mt-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({logData.totalRows}
						entries)
					</p>
					<select
						value={table.getState().pagination.pageSize}
						onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
						class="rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					>
						{#each PAGE_SIZES as size (size)}
							<option value={size}>{size} / page</option>
						{/each}
					</select>
				</div>
				<div class="flex gap-2">
					{#if table.getCanPreviousPage()}
						<button
							onclick={() => table.previousPage()}
							disabled={logLoading}
							class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
						>
							Previous
						</button>
					{/if}
					{#if table.getCanNextPage()}
						<button
							onclick={() => table.nextPage()}
							disabled={logLoading}
							class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
						>
							Next
						</button>
					{/if}
				</div>
			</div>
		{:else if logData}
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
				<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No analytics data</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					No redirects have been recorded in the last {data.days} days.
				</p>
			</div>
		{/if}
	</div>
</div>
