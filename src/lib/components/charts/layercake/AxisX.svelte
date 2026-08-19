<script lang="ts">
	import { layerCake } from './context';

	const { xScale, height, width } = layerCake<unknown>();

	interface Props {
		gridlines?: boolean;
		tickCount?: number;
		format?: (value: unknown) => string;
		/** Rotate labels 45° and right-align them — for dense/long tick labels. */
		rotated?: boolean;
	}

	let { gridlines = true, tickCount = 5, format = (v) => String(v), rotated = false }: Props = $props();

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
		{#if rotated}
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
		{:else}
			<text {x} y={$height + 16} text-anchor="middle" fill="rgb(156, 163, 175)" font-size="10">
				{format(tick)}
			</text>
		{/if}
	{/each}
</g>
