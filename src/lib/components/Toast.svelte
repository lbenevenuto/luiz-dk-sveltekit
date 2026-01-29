<script lang="ts">
	import { getToasts, removeToast, type Toast } from '$lib/stores/toast.svelte';

	const iconPaths: Record<Toast['type'], string> = {
		success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		error: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
		info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
	};

	const colorClasses: Record<Toast['type'], string> = {
		success: 'border-green-700 bg-green-900/80 text-green-200',
		error: 'border-red-700 bg-red-900/80 text-red-200',
		info: 'border-indigo-700 bg-indigo-900/80 text-indigo-200'
	};

	const iconColors: Record<Toast['type'], string> = {
		success: 'text-green-400',
		error: 'text-red-400',
		info: 'text-indigo-400'
	};
</script>

{#if getToasts().length > 0}
	<div class="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-2 p-4 sm:p-6">
		{#each getToasts() as t (t.id)}
			<div
				class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm {colorClasses[
					t.type
				]}"
				role="alert"
			>
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 {iconColors[t.type]}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d={iconPaths[t.type]} />
				</svg>
				<p class="flex-1 text-sm font-medium">{t.message}</p>
				<button
					onclick={() => removeToast(t.id)}
					class="flex-shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
					aria-label="Dismiss notification"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}
