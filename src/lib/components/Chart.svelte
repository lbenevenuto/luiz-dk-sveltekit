<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, type ChartConfiguration, type ChartType } from 'chart.js/auto';

	interface Props {
		type: ChartType;
		data: ChartConfiguration['data'];
		options?: ChartConfiguration['options'];
	}

	let { type, data, options = {} }: Props = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (ctx) {
			chart = new Chart(ctx, {
				type,
				data,
				options
			});
		}
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	$effect(() => {
		if (chart) {
			chart.data = data;
			chart.options = options;
			chart.update();
		}
	});
</script>

<canvas bind:this={canvas}></canvas>
