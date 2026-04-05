<script lang="ts">
	import { LayerCake, Svg, Html } from 'layercake';
	import { scaleTime, scaleLinear } from 'd3-scale';
	import Line from './layercake/Line.svelte';
	import Area from './layercake/Area.svelte';
	import AxisX from './layercake/AxisX.svelte';
	import AxisY from './layercake/AxisY.svelte';
	import Tooltip from './layercake/Tooltip.svelte';

	interface DataPoint {
		date: string;
		count: number;
	}

	interface Props {
		data: DataPoint[];
	}

	let { data }: Props = $props();

	const chartData = $derived(
		data.map((d) => ({
			date: new Date(`${d.date}T00:00:00`),
			value: d.count
		}))
	);

	const formatDate = (d: unknown) => {
		const date = d as Date;
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, '0');
		const dd = String(date.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	};
</script>

<div class="h-full w-full">
	<LayerCake
		x="date"
		y="value"
		data={chartData}
		xScale={scaleTime()}
		padding={{ top: 16, right: 8, bottom: 80, left: 32 }}
		yDomain={[0, null]}
		yScale={scaleLinear()}
	>
		<Svg>
			<AxisY tickCount={5} format={(d) => (d as number).toLocaleString()} />
			<AxisX tickCount={10} format={formatDate} />
			<Area fill="rgba(59, 130, 246, 0.2)" />
			<Line stroke="#3b82f6" strokeWidth={2} showPoints />
		</Svg>
		<Html>
			<Tooltip formatDate={(d) => formatDate(d)} />
		</Html>
	</LayerCake>
</div>
