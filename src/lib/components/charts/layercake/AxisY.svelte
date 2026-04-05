<script lang="ts">
	import { getContext } from 'svelte';
	interface LayerCakeContext {
		yScale: {
			subscribe: (
				fn: (v: {
					ticks?: (n: number) => unknown[];
					domain: () => unknown[];
					bandwidth?: () => number;
					(d: unknown): number;
				}) => void
			) => () => void;
		};
		width: { subscribe: (fn: (v: number) => void) => () => void };
		height: { subscribe: (fn: (v: number) => void) => () => void };
	}

	const { yScale, width, height } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		gridlines?: boolean;
		tickCount?: number;
		format?: (value: unknown) => string;
	}

	let { gridlines = true, tickCount = 5, format = (v) => String(v) }: Props = $props();

	const ticks = $derived(() => {
		if ($yScale.ticks) {
			return $yScale.ticks(tickCount);
		}
		return $yScale.domain ? $yScale.domain() : [];
	});

	function getYPosition(tick: unknown): number {
		const y = $yScale(tick);
		if ($yScale.bandwidth) {
			return y + $yScale.bandwidth() / 2;
		}
		return y;
	}
</script>

<g class="axis y-axis">
	<line x1={0} x2={0} y1={0} y2={$height} stroke="rgba(156, 163, 175, 0.5)" stroke-width="1" />
	{#each ticks() as tick (tick)}
		{@const y = getYPosition(tick)}
		{#if gridlines}
			<line x1={0} x2={$width} y1={y} y2={y} stroke="rgba(156, 163, 175, 0.2)" stroke-dasharray="2,2" />
		{/if}
		<text x={-8} {y} dy="0.32em" text-anchor="end" fill="rgb(156, 163, 175)" font-size="11">
			{format(tick)}
		</text>
	{/each}
</g>
