<script lang="ts">
	import { getContext } from 'svelte';
	import { area as d3Area, curveMonotoneX } from 'd3-shape';
	interface LayerCakeContext {
		data: { subscribe: (fn: (v: Array<{ date: Date; value: number }>) => void) => () => void };
		xGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
		yGet: { subscribe: (fn: (v: (d: { date: Date; value: number }) => number) => void) => () => void };
		yScale: { subscribe: (fn: (v: (n: number) => number) => void) => () => void };
	}

	const { data, xGet, yGet, yScale } = getContext('LayerCake') as LayerCakeContext;

	interface Props {
		fill?: string;
	}

	let { fill = 'rgba(59, 130, 246, 0.2)' }: Props = $props();

	const areaGenerator = $derived(
		d3Area<{ date: Date; value: number }>()
			.x((d) => $xGet(d))
			.y0(() => $yScale(0))
			.y1((d) => $yGet(d))
			.curve(curveMonotoneX)
	);

	const path = $derived(areaGenerator($data) || '');
</script>

<path d={path} {fill} />
