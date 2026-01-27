<script lang="ts">
	let {
		type = 'text',
		label,
		value = $bindable(''),
		placeholder = '',
		required = false,
		error = '',
		disabled = false,
		autocomplete = undefined,
		id = ''
	}: {
		type?: 'text' | 'email' | 'password' | 'number';
		label: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		error?: string;
		disabled?: boolean;
		autocomplete?: string;
		id?: string;
	} = $props();

	const inputId = $derived(id || `input-${Math.random().toString(36).substr(2, 9)}`);
	const errorId = $derived(`${inputId}-error`);
</script>

<div class="flex flex-col space-y-2">
	<label for={inputId} class="font-medium text-gray-300">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		{disabled}
		autocomplete={autocomplete as any}
		aria-invalid={error ? 'true' : 'false'}
		aria-describedby={error ? errorId : undefined}
		class="w-full rounded-lg border-2 bg-transparent px-4 py-3 text-white transition-all placeholder:text-gray-400 focus:outline-none {error
			? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
			: 'border-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} {disabled
			? 'cursor-not-allowed opacity-50'
			: ''}"
	/>
	{#if error}
		<p id={errorId} class="text-sm text-red-400">
			{error}
		</p>
	{/if}
</div>
