<script lang="ts">
	import { getContext } from 'svelte';

	interface LayerCakeContext {
		data: { subscribe: (fn: (v: Array<{ date: Date; value: number }>) => void) => () => void };
		xGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
		yGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
	}

	const { data, xGet, yGet } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		color?: string;
		fontSize?: number;
		offset?: number;
	}

	let { color = '#9ca3af', fontSize = 10, offset = -8 }: Props = $props();

	function shouldShowLabel(value: number): boolean {
		// Only show labels for values > 0 to avoid cluttering
		return value > 0;
	}
</script>

<g>
	{#each $data as d (d.date.toISOString())}
		{@const x = $xGet(d)}
		{@const y = $yGet(d)}
		{#if shouldShowLabel(d.value)}
			<text {x} y={y + offset} text-anchor="middle" fill={color} font-size={fontSize} font-weight="500">
				{d.value}
			</text>
		{/if}
	{/each}
</g>
