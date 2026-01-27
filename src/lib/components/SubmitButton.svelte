<script lang="ts">
	let {
		loading = false,
		disabled = false,
		text = 'Submit',
		loadingText = 'Loading...'
	}: {
		loading?: boolean;
		disabled?: boolean;
		text?: string;
		loadingText?: string;
	} = $props();

	const isDisabled = $derived(loading || disabled);
</script>

<button
	type="submit"
	disabled={isDisabled}
	class="w-full transform rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:from-indigo-600 hover:to-purple-700 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
>
	{#if loading}
		<span class="flex items-center justify-center space-x-2">
			<div class="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
			<span>{loadingText}</span>
		</span>
	{:else}
		{text}
	{/if}
</button>
