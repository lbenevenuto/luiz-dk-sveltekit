<script lang="ts">
	import { area as d3Area, curveMonotoneX } from 'd3-shape';
	import { layerCake } from './context';

	const { data, xGet, yGet, yScale } = layerCake<{ date: Date; value: number }>();

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
