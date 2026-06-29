<script lang="ts">
	import { spinnerClasses, type SpinnerSize } from './spinner-classes';

	let { size = 'lg', class: className = '' }: { size?: SpinnerSize; class?: string } = $props();
</script>

<div class={spinnerClasses(size, className)}></div>
