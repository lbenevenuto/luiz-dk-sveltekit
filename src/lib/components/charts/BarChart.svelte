<script lang="ts">
	import { LayerCake, Svg, Html } from 'layercake';
	import { scaleBand } from 'd3-scale';
	import Bars from './layercake/Bars.svelte';
	import AxisX from './layercake/AxisXHorizontal.svelte';
	import AxisY from './layercake/AxisY.svelte';
	import BarTooltip from './layercake/BarTooltip.svelte';

	interface DataPoint {
		label: string;
		value: number;
	}

	interface Props {
		data: DataPoint[];
	}

	let { data }: Props = $props();

	const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

	const colorMap = $derived(new Map(data.map((item, i) => [item.label, colors[i % colors.length]])));

	const fillFn = (d: { label: string }) => colorMap.get(d.label) ?? colors[0];

	let hoveredIndex: number | null = $state(null);
</script>

<div class="h-full w-full">
	<LayerCake
		x="value"
		y="label"
		{data}
		xDomain={[0, null]}
		yScale={scaleBand()}
		padding={{ top: 8, right: 32, bottom: 24, left: 40 }}
	>
		<Svg>
			<AxisX tickCount={5} format={(d) => (d as number).toLocaleString()} />
			<AxisY gridlines={false} />
			<Bars fill={(d) => fillFn(d as { label: string })} radius={4} bandPadding={0.3} {hoveredIndex} />
		</Svg>
		<Html>
			<BarTooltip {colors} bind:hoveredIndex />
		</Html>
	</LayerCake>
</div>
