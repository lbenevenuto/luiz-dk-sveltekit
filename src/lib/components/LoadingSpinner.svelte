<script lang="ts">
	type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
	const sizes: Record<SpinnerSize, string> = {
		sm: 'h-5 w-5',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	let { size = 'lg', class: className = '' }: { size?: SpinnerSize; class?: string } = $props();
</script>

<div class={`${sizes[size]} animate-spin rounded-full ${className}`}></div>
