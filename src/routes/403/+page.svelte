<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	// Get the attempted URL from query params
	$: attemptedUrl = $page.url.searchParams.get('url') || '/admin';
</script>

<svelte:head>
	<title>Access Denied - luiz.dk</title>
</svelte:head>

<div class="flex min-h-full items-center justify-center px-4">
	<div class="w-full max-w-md text-center">
		<!-- Icon -->
		<div class="mb-8">
			<div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-8 ring-red-500/5">
				<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
		</div>

		<!-- Content -->
		<h1 class="mb-4 text-4xl font-bold text-white">Access Denied</h1>

		<p class="mb-8 text-lg text-gray-400">
			You don't have permission to access this page. Admin privileges are required.
		</p>

		<!-- Attempted URL (if not default) -->
		{#if attemptedUrl !== '/admin'}
			<div class="mb-8 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
				<p class="mb-1 text-sm text-gray-400">Attempted to access:</p>
				<code class="text-sm text-indigo-400">{attemptedUrl}</code>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<a
				href={resolve('/')}
				class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Go Home
			</a>

			<button
				onclick={() => window.history.back()}
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Go Back
			</button>
		</div>

		<!-- Help text -->
		<p class="mt-8 text-sm text-gray-500">If you believe you should have access, please contact an administrator.</p>
	</div>
</div>
