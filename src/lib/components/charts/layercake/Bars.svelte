<script lang="ts">
	import { layerCake } from './context';

	const { data, xGet, yGet, yScale, xScale } = layerCake<{ label: string; value: number }>();

	interface Props {
		fill?: string | ((d: unknown) => string);
		radius?: number;
		bandPadding?: number;
		showValues?: boolean;
		hoveredIndex?: number | null;
		onhover?: (index: number | null) => void;
	}

	let {
		fill = '#3b82f6',
		radius = 4,
		bandPadding = 0.2,
		showValues = true,
		hoveredIndex = null,
		onhover
	}: Props = $props();

	const barHeight = $derived(() => {
		if ($yScale.bandwidth) {
			return $yScale.bandwidth() * (1 - bandPadding);
		}
		return 20;
	});

	function getFill(d: unknown): string {
		if (typeof fill === 'function') {
			return fill(d);
		}
		return fill;
	}
</script>

<g>
	{#each $data as d, i (i)}
		{@const y = $yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() * (bandPadding / 2) : 0)}
		{@const x = $xScale(0)}
		{@const width = $xGet(d) - $xScale(0)}
		{@const barFill = getFill(d)}
		{@const isHovered = hoveredIndex === i}
		{@const isDimmed = hoveredIndex !== null && hoveredIndex !== i}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<g onmouseenter={() => onhover?.(i)} onmouseleave={() => onhover?.(null)} style="cursor: pointer;">
			<rect
				{x}
				{y}
				{width}
				height={barHeight()}
				fill={barFill}
				rx={radius}
				opacity={isDimmed ? 0.4 : 1}
				style="transition: opacity 150ms ease;"
			/>
			{#if isHovered}
				<rect {x} {y} {width} height={barHeight()} fill="white" rx={radius} opacity="0.15" />
			{/if}
			{#if showValues}
				<text
					x={x + width + 6}
					y={y + barHeight() / 2}
					dy="0.32em"
					fill="rgb(156, 163, 175)"
					font-size="11"
					font-weight={isHovered ? '700' : '500'}
					style="transition: font-weight 150ms ease;"
				>
					{d.value}
				</text>
			{/if}
		</g>
	{/each}
</g>
