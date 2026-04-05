<script lang="ts">
	import { LayerCake, Svg, Html } from 'layercake';
	import Arcs from './layercake/Arcs.svelte';

	interface DataPoint {
		label: string;
		value: number;
	}

	interface Props {
		data: DataPoint[];
	}

	let { data }: Props = $props();

	const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

	let hoveredIndex: number | null = $state(null);
	let mousePos = $state({ x: 0, y: 0 });

	const total = $derived(data.reduce((sum, d) => sum + d.value, 0));

	function handleContainerMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative flex h-full w-full items-center justify-center gap-6" onmousemove={handleContainerMouseMove}>
	<div class="h-48 w-48">
		<LayerCake x="label" y="value" {data}>
			<Svg>
				<Arcs {colors} innerRadius={0.5} padAngle={0.02} {hoveredIndex} onhover={(i) => (hoveredIndex = i)} />
			</Svg>
			<Html>
				{#if hoveredIndex !== null}
					{@const item = data[hoveredIndex]}
					{@const itemColor = colors[hoveredIndex % colors.length]}
					{@const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}
					<div
						class="pointer-events-none absolute z-10 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
						style="left: {mousePos.x + 12}px; top: {mousePos.y - 40}px;"
					>
						<div class="mb-1 font-semibold">{item.label}</div>
						<div class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {itemColor}"></span>
							{item.value} ({pct}%)
						</div>
					</div>
				{/if}
			</Html>
		</LayerCake>
	</div>

	<div class="flex flex-col gap-2 text-sm">
		{#each data as item, i (item.label)}
			{@const isHovered = hoveredIndex === i}
			{@const isDimmed = hoveredIndex !== null && hoveredIndex !== i}
			<button
				type="button"
				class="flex w-full items-center gap-2 rounded border-none bg-transparent px-1 py-0.5 text-left text-sm"
				style="opacity: {isDimmed ? 0.4 : 1}; transition: opacity 150ms ease; cursor: pointer;"
				onmouseenter={() => (hoveredIndex = i)}
				onmouseleave={() => (hoveredIndex = null)}
				onfocus={() => (hoveredIndex = i)}
				onblur={() => (hoveredIndex = null)}
			>
				<div class="h-3 w-3 rounded-sm" style="background-color: {colors[i % colors.length]}"></div>
				<span class="text-gray-700 dark:text-gray-300" class:font-semibold={isHovered}>{item.label}</span>
				<span class="ml-auto text-gray-500 dark:text-gray-400" class:font-semibold={isHovered}>{item.value}</span>
			</button>
		{/each}
	</div>
</div>
