<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		message = '',
		padding = 'p-4',
		class: className = '',
		children
	}: { message?: string; padding?: string; class?: string; children?: Snippet } = $props();
</script>

<div
	class="rounded-lg border-2 border-red-200 bg-red-50 {padding} text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400 {className}"
>
	{#if children}{@render children()}{:else}{message}{/if}
</div>
