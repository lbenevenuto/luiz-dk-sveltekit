<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} - luiz.dk</title>
</svelte:head>

<div class="flex min-h-full items-center justify-center px-4">
	<div class="w-full max-w-md text-center">
		<!-- Icon -->
		<div class="mb-8">
			{#if page.status === 404}
				<div
					class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 ring-8 ring-indigo-500/5"
				>
					<svg class="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
						/>
					</svg>
				</div>
			{:else}
				<div
					class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-8 ring-red-500/5"
				>
					<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
						/>
					</svg>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<h1 class="mb-2 text-6xl font-bold text-white">{page.status}</h1>
		<p class="mb-8 text-lg text-gray-400">
			{#if page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else if page.status === 500}
				Something went wrong on our end. Please try again later.
			{:else}
				{page.error?.message || 'An unexpected error occurred.'}
			{/if}
		</p>

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
	</div>
</div>
