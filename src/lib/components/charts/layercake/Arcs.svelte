<script lang="ts">
	import { getContext } from 'svelte';
	import { pie as d3Pie, arc as d3Arc } from 'd3-shape';

	interface LayerCakeContext {
		data: { subscribe: (fn: (v: Array<{ label: string; value: number }>) => void) => () => void };
		width: { subscribe: (fn: (v: number) => void) => () => void };
		height: { subscribe: (fn: (v: number) => void) => () => void };
	}

	const { data, width, height } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		innerRadius?: number;
		colors?: string[];
		padAngle?: number;
		hoveredIndex?: number | null;
		onhover?: (index: number | null) => void;
	}

	let {
		innerRadius = 0.5,
		colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'],
		padAngle = 0.02,
		hoveredIndex = null,
		onhover
	}: Props = $props();

	const radius = $derived(Math.min($width, $height) / 2);
	const innerR = $derived(radius * innerRadius);

	const pieGenerator = $derived(
		d3Pie<{ label: string; value: number }>()
			.value((d) => d.value)
			.padAngle(padAngle)
			.sort(null)
	);

	const arcGenerator = $derived(d3Arc().outerRadius(radius).innerRadius(innerR));

	const hoverArcGenerator = $derived(
		d3Arc()
			.outerRadius(radius + 6)
			.innerRadius(innerR)
	);

	const arcs = $derived(pieGenerator($data));
</script>

<g transform="translate({$width / 2}, {$height / 2})">
	{#each arcs as arc, i (arc.data.label)}
		{@const arcWithRadius = { ...arc, innerRadius: innerR, outerRadius: radius }}
		{@const hoverArcWithRadius = { ...arc, innerRadius: innerR, outerRadius: radius + 6 }}
		{@const isHovered = hoveredIndex === i}
		{@const isDimmed = hoveredIndex !== null && hoveredIndex !== i}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<path
			d={(isHovered ? hoverArcGenerator(hoverArcWithRadius) : arcGenerator(arcWithRadius)) || ''}
			fill={colors[i % colors.length]}
			stroke="rgba(255, 255, 255, 0.2)"
			stroke-width="2"
			opacity={isDimmed ? 0.4 : 1}
			style="cursor: pointer; transition: opacity 150ms ease, d 150ms ease;"
			onmouseenter={() => onhover?.(i)}
			onmouseleave={() => onhover?.(null)}
		/>
	{/each}
</g>
