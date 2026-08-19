<script lang="ts">
	const SIZE_CLASSES = {
		sm: 'h-5 w-5',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	let { size = 'lg', class: className = '' }: { size?: keyof typeof SIZE_CLASSES; class?: string } = $props();
</script>

<div class="{SIZE_CLASSES[size]} animate-spin rounded-full {className}"></div>
