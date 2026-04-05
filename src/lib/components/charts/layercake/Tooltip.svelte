<script lang="ts">
	import { getContext } from 'svelte';

	interface ChartDataPoint {
		date: Date;
		value: number;
	}

	interface LayerCakeContext {
		data: { subscribe: (fn: (v: ChartDataPoint[]) => void) => () => void };
		xGet: { subscribe: (fn: (v: (d: ChartDataPoint) => number) => void) => () => void };
		yGet: { subscribe: (fn: (v: (d: ChartDataPoint) => number) => void) => () => void };
		width: { subscribe: (fn: (v: number) => void) => () => void };
		height: { subscribe: (fn: (v: number) => void) => () => void };
	}

	interface Props {
		formatDate?: (d: Date) => string;
		formatValue?: (v: number) => string;
		label?: string;
		color?: string;
	}

	let {
		formatDate = (d: Date) => d.toISOString().split('T')[0],
		formatValue = (v: number) => v.toLocaleString(),
		label = 'Clicks',
		color = '#3b82f6'
	}: Props = $props();

	const { data, xGet, yGet, width } = getContext('LayerCake') as LayerCakeContext;

	let hoveredIndex: number | null = $state(null);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mouseX = e.clientX - rect.left;

		let closestIndex = 0;
		let closestDist = Infinity;

		for (let i = 0; i < $data.length; i++) {
			const dist = Math.abs($xGet($data[i]) - mouseX);
			if (dist < closestDist) {
				closestDist = dist;
				closestIndex = i;
			}
		}

		hoveredIndex = closestDist < 40 ? closestIndex : null;
	}

	function handleMouseLeave() {
		hoveredIndex = null;
	}

	const tooltipX = $derived(hoveredIndex !== null ? $xGet($data[hoveredIndex]) : 0);
	const tooltipY = $derived(hoveredIndex !== null ? $yGet($data[hoveredIndex]) : 0);
	const tooltipPoint = $derived(hoveredIndex !== null ? $data[hoveredIndex] : null);

	const tooltipLeft = $derived(tooltipX > $width / 2 ? tooltipX - 140 : tooltipX + 12);
	const tooltipTop = $derived(Math.max(0, tooltipY - 50));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="absolute inset-0" onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
	{#if tooltipPoint}
		<div
			class="pointer-events-none absolute z-10 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
			style="left: {tooltipLeft}px; top: {tooltipTop}px;"
		>
			<div class="mb-1 font-semibold">{formatDate(tooltipPoint.date)}</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {color}"></span>
				{label}: {formatValue(tooltipPoint.value)}
			</div>
		</div>

		<div
			class="pointer-events-none absolute h-full border-l border-dashed border-gray-400/50"
			style="left: {tooltipX}px; top: 0;"
		></div>
	{/if}
</div>
