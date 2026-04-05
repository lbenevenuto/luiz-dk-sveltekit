<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchInput = $derived(data.q);

	function formatDate(date: Date): string {
		const d = new Date(date);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	}

	function buildUrl(overrides: Record<string, string | undefined>) {
		const entries: [string, string][] = [];
		const q = overrides.q ?? data.q;
		const userId = overrides.userId ?? data.userIdFilter;
		const anonymous = overrides.anonymous ?? (data.anonymous ? 'true' : undefined);
		const pg = overrides.page ?? String(data.page);

		if (q) entries.push(['q', q]);
		if (anonymous === 'true') {
			entries.push(['anonymous', 'true']);
		} else if (userId) {
			entries.push(['userId', userId]);
		}
		if (pg && pg !== '1') entries.push(['page', pg]);

		const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
		return qs ? `?${qs}` : page.url.pathname;
	}

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		goto(buildUrl({ q: searchInput || undefined, page: '1' }));
	}

	function clearFilters() {
		searchInput = '';
		goto(page.url.pathname);
	}

	const hasFilters = $derived(data.q || data.userIdFilter || data.anonymous);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-white">URL Management</h2>
		<div class="text-sm text-gray-400">
			{data.total} URL{data.total !== 1 ? 's' : ''} found
		</div>
	</div>

	<!-- Search & Filters -->
	<div class="rounded-lg bg-gray-800 p-4">
		<form onsubmit={handleSearch} class="flex flex-col gap-4 md:flex-row md:items-end">
			<div class="flex-1">
				<label for="search" class="mb-1 block text-sm font-medium text-gray-300">Search</label>
				<input
					id="search"
					type="text"
					bind:value={searchInput}
					placeholder="Search by short code or URL..."
					class="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>
			<div class="flex gap-2">
				<button
					type="submit"
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
				>
					Search
				</button>
				{#if hasFilters}
					<button
						type="button"
						onclick={clearFilters}
						class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-500"
					>
						Clear
					</button>
				{/if}
			</div>
		</form>

		<!-- Active Filters -->
		{#if data.userIdFilter}
			<div class="mt-3 flex items-center gap-2 text-sm text-gray-400">
				<span>Filtered by user:</span>
				<span class="rounded-full bg-indigo-900/50 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
					{data.userIdFilter}
				</span>
				<a href={buildUrl({ userId: undefined, anonymous: undefined })} class="text-gray-500 hover:text-gray-300">
					&times;
				</a>
			</div>
		{/if}
		{#if data.anonymous}
			<div class="mt-3 flex items-center gap-2 text-sm text-gray-400">
				<span>Showing:</span>
				<span class="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
					Anonymous URLs only
				</span>
				<a href={buildUrl({ anonymous: undefined })} class="text-gray-500 hover:text-gray-300"> &times; </a>
			</div>
		{/if}
	</div>

	<!-- URL Table -->
	<div class="overflow-hidden rounded-lg bg-gray-800">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-700">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">Short Code</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">Original URL</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">User</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">Created</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase">Expires</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each data.urls as url (url.id)}
						<tr class="hover:bg-gray-750 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<a
									href="/s/{url.shortCode}"
									target="_blank"
									rel="noopener noreferrer"
									class="font-mono text-sm text-indigo-400 hover:text-indigo-300"
								>
									{url.shortCode}
								</a>
							</td>
							<td class="max-w-xs truncate px-6 py-4">
								<a
									href={url.originalUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-blue-400 hover:text-blue-300"
									title={url.originalUrl}
								>
									{url.originalUrl}
								</a>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if url.userId}
									<a
										href={buildUrl({ userId: url.userId, anonymous: undefined, page: '1' })}
										class="text-sm text-gray-300 hover:text-white"
										title="Filter by this user"
									>
										{url.userId}
									</a>
								{:else}
									<a
										href={buildUrl({ anonymous: 'true', userId: undefined, page: '1' })}
										class="text-sm text-gray-500 italic hover:text-gray-300"
										title="Filter anonymous URLs"
									>
										anonymous
									</a>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-400">
								{formatDate(url.createdAt)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if url.expiresAt}
									{@const expired = new Date(url.expiresAt) < new Date()}
									<span class="text-sm {expired ? 'text-red-400' : 'text-gray-400'}">
										{formatDate(url.expiresAt)}
										{#if expired}
											<span class="ml-1 text-xs">(expired)</span>
										{/if}
									</span>
								{:else}
									<span class="text-sm text-gray-500">Never</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.urls.length === 0}
			<div class="px-6 py-12 text-center">
				<p class="text-gray-400">No URLs found</p>
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-between">
			<div class="text-sm text-gray-400">
				Page {data.page} of {data.totalPages}
			</div>
			<div class="flex gap-2">
				{#if data.page > 1}
					<a
						href={buildUrl({ page: String(data.page - 1) })}
						class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
					>
						Previous
					</a>
				{/if}
				{#if data.page < data.totalPages}
					<a
						href={buildUrl({ page: String(data.page + 1) })}
						class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
					>
						Next
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
