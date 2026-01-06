<script lang="ts">
	let url = '';

	let expiresIn = '';
	let result: {
		shortUrl: string;
		originalUrl: string;
		shortCode: string;
		expiresAt: string;
		isExisting?: boolean;
	} | null = null;
	let error: string | null = null;
	let loading = false;

	async function shortenUrl() {
		if (!url) {
			error = 'Please enter a URL';
			return;
		}

		loading = true;
		error = null;
		result = null;

		try {
			const body: {
				url: string;
				expiresIn?: number;
			} = {
				url
			};

			if (expiresIn) {
				body.expiresIn = parseInt(expiresIn) * 3600;
			}

			const response = await fetch('/api/v1/shorten', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			const data = (await response.json()) as {
				shortUrl: string;
				originalUrl: string;
				shortCode: string;
				expiresAt: string;
				error?: string;
				isExisting?: boolean;
			};

			if (response.ok) {
				console.log(data);
				result = data;
				url = '';

				expiresIn = '';
			} else {
				error = data?.error || 'Failed to create short URL';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function copyToClipboard() {
		if (result?.shortUrl) {
			navigator.clipboard.writeText(result.shortUrl);
			alert('Copied to clipboard!');
		}
	}
</script>

<svelte:head>
	<title>URL Shortener - luiz.dk</title>
	<meta name="description" content="Fast URL shortener with Hashids, Drizzle ORM, and Cloudflare" />
</svelte:head>

<div class="flex min-h-full flex-col justify-center">
	<div
		class="mx-auto my-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl md:p-8 dark:bg-slate-800"
	>
		<h1 class="mb-2 text-center text-3xl font-bold text-slate-800 md:text-4xl dark:text-white">
			🔗 URL Shortener
		</h1>
		<p class="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
			Built with Hashids, Drizzle ORM, Bun & Cloudflare Pages
		</p>

		<div class="mb-8 space-y-6">
			<div class="flex flex-col space-y-2">
				<label for="url" class="font-medium text-slate-700 dark:text-slate-200">
					URL to shorten <span class="text-red-500">*</span>
				</label>
				<input
					id="url"
					type="url"
					bind:value={url}
					placeholder="https://example.com/very/long/url"
					required
					class="w-full rounded-lg border-2 border-slate-200 bg-transparent px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:text-white"
				/>
			</div>

			<div class="flex flex-col space-y-2">
				<label for="expiresIn" class="font-medium text-slate-700 dark:text-slate-200">
					Expires in (hours, optional)
				</label>
				<input
					id="expiresIn"
					type="number"
					bind:value={expiresIn}
					placeholder="24"
					min="1"
					class="w-full rounded-lg border-2 border-slate-200 bg-transparent px-4 py-3 text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:text-white"
				/>
			</div>

			<button
				on:click={shortenUrl}
				disabled={loading}
				class="w-full transform rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:from-indigo-600 hover:to-purple-700 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Shorten URL'}
			</button>
		</div>

		{#if error}
			<div
				class="mb-8 rounded-lg border-2 border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
			>
				<strong>Error:</strong>
				{error}
			</div>
		{/if}

		{#if result}
			<div
				class="mb-8 rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20"
			>
				<h3 class="mb-4 text-lg font-bold text-green-700 dark:text-green-400">
					{#if result.isExisting}
						ℹ️ Existing Short URL Found
					{:else}
						✅ Short URL Created!
					{/if}
				</h3>
				<div class="mb-2 flex flex-col gap-2 sm:flex-row">
					<a
						href={result.shortUrl}
						target="_blank"
						rel="noopener"
						class="flex-1 rounded-lg border-2 border-green-200 bg-white p-3 text-center font-semibold break-all text-indigo-600 hover:underline sm:text-left dark:border-green-800 dark:bg-slate-900 dark:text-indigo-400"
					>
						{result.shortUrl}
					</a>
					<button
						class="rounded-lg bg-indigo-500 px-6 py-3 font-medium whitespace-nowrap text-white shadow-md transition-colors hover:bg-indigo-600"
						on:click={copyToClipboard}
					>
						📋 Copy
					</button>
				</div>
				<p class="text-sm text-slate-500 dark:text-slate-400">
					Original: <a
						href={result.originalUrl}
						target="_blank"
						rel="noopener"
						class="break-all text-indigo-500 hover:underline"
					>
						{result.originalUrl.length > 60
							? result.originalUrl.substring(0, 60) + '...'
							: result.originalUrl}
					</a>
				</p>
			</div>
		{/if}

		<div
			class="mt-8 grid grid-cols-1 gap-6 border-t border-slate-100 pt-8 sm:grid-cols-3 dark:border-slate-700"
		>
			<div class="text-center">
				<h3 class="mb-1 font-bold text-slate-800 dark:text-white">🔢 Hashids</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400">Obfuscated sequential IDs</p>
			</div>
			<div class="text-center">
				<h3 class="mb-1 font-bold text-slate-800 dark:text-white">🗄️ Drizzle</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400">Type-safe ORM queries</p>
			</div>
			<div class="text-center">
				<h3 class="mb-1 font-bold text-slate-800 dark:text-white">⚡ Bun</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400">Fast JavaScript runtime</p>
			</div>
		</div>
	</div>
</div>
