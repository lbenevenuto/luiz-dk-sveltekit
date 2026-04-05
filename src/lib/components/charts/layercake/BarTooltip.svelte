<script lang="ts">
	import { getContext } from 'svelte';

	interface ChartDataPoint {
		label: string;
		value: number;
	}

	interface LayerCakeContext {
		data: { subscribe: (fn: (v: ChartDataPoint[]) => void) => () => void };
		yGet: { subscribe: (fn: (v: (d: ChartDataPoint) => number) => void) => () => void };
		yScale: { subscribe: (fn: (v: { bandwidth?: () => number }) => void) => () => void };
		height: { subscribe: (fn: (v: number) => void) => () => void };
	}

	interface Props {
		colors: string[];
		hoveredIndex?: number | null;
		onhover?: (index: number | null) => void;
	}

	let { colors, hoveredIndex = $bindable(null), onhover }: Props = $props();

	const { data, yGet, yScale } = getContext('LayerCake') as LayerCakeContext;

	let mousePos = $state({ x: 0, y: 0 });

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mouseY = e.clientY - rect.top;
		mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

		const bandwidth = $yScale.bandwidth?.() ?? 20;
		let found: number | null = null;

		for (let i = 0; i < $data.length; i++) {
			const barY = $yGet($data[i]);
			if (mouseY >= barY && mouseY <= barY + bandwidth) {
				found = i;
				break;
			}
		}

		hoveredIndex = found;
		onhover?.(found);
	}

	function handleMouseLeave() {
		hoveredIndex = null;
		onhover?.(null);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="absolute inset-0" onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}>
	{#if hoveredIndex !== null}
		{@const item = $data[hoveredIndex]}
		{@const itemColor = colors[hoveredIndex % colors.length]}
		<div
			class="pointer-events-none absolute z-10 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
			style="left: {mousePos.x + 12}px; top: {mousePos.y - 40}px;"
		>
			<div class="mb-1 font-semibold">{item.label}</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {itemColor}"></span>
				Clicks: {item.value.toLocaleString()}
			</div>
		</div>
	{/if}
</div>
