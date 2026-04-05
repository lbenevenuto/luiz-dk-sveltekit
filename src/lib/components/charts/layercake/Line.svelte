<script lang="ts">
	import { getContext } from 'svelte';
	import { line as d3Line, curveMonotoneX } from 'd3-shape';

	interface LayerCakeContext {
		data: { subscribe: (fn: (v: Array<{ date: Date; value: number }>) => void) => () => void };
		xGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
		yGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
	}

	const { data, xGet, yGet } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		stroke?: string;
		strokeWidth?: number;
		showPoints?: boolean;
	}

	let { stroke = '#3b82f6', strokeWidth = 2, showPoints = false }: Props = $props();

	const pathGenerator = $derived(
		d3Line<{ date: Date; value: number }>()
			.x((d) => $xGet(d))
			.y((d) => $yGet(d))
			.curve(curveMonotoneX)
	);

	const path = $derived(pathGenerator($data) || '');
</script>

<path d={path} fill="none" {stroke} stroke-width={strokeWidth} stroke-linejoin="round" stroke-linecap="round" />
{#if showPoints}
	{#each $data as d, i (i)}
		<circle cx={$xGet(d)} cy={$yGet(d)} r={3} fill={stroke} stroke="white" stroke-width={1} />
	{/each}
{/if}
