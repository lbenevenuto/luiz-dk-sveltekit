<script lang="ts">
	import { getContext } from 'svelte';
	interface LayerCakeContext {
		xScale: {
			subscribe: (
				fn: (v: { ticks?: (n: number) => unknown[]; domain: () => unknown[]; (n: unknown): number }) => void
			) => () => void;
		};
		height: { subscribe: (fn: (v: number) => void) => () => void };
		width: { subscribe: (fn: (v: number) => void) => () => void };
	}

	const { xScale, height, width } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		gridlines?: boolean;
		tickCount?: number;
		format?: (value: unknown) => string;
	}

	let { gridlines = true, tickCount = 6, format = (v) => String(v) }: Props = $props();

	const ticks = $derived(() => {
		if ($xScale.ticks) {
			return $xScale.ticks(tickCount);
		}
		return $xScale.domain ? $xScale.domain() : [];
	});
</script>

<g class="axis x-axis">
	<line x1={0} x2={$width} y1={$height} y2={$height} stroke="rgba(156, 163, 175, 0.5)" stroke-width="1" />
	{#each ticks() as tick (tick)}
		{@const x = $xScale(tick)}
		{#if gridlines}
			<line x1={x} x2={x} y1={0} y2={$height} stroke="rgba(156, 163, 175, 0.2)" stroke-dasharray="2,2" />
		{/if}
		<text
			{x}
			y={$height + 20}
			text-anchor="end"
			fill="rgb(156, 163, 175)"
			font-size="9"
			transform="rotate(-45, {x}, {$height + 20})"
		>
			{format(tick)}
		</text>
	{/each}
</g>
