<script lang="ts">
	import { page } from '$app/state';

	interface SEOProps {
		title: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article';
		noindex?: boolean;
	}

	let {
		title,
		description = 'Personal Cloud Services - URL shortener and more at luiz.dk',
		image,
		type = 'website',
		noindex = false
	}: SEOProps = $props();

	const siteName = 'luiz.dk';
	const fullTitle = $derived(title === 'Home' ? `${siteName} - Personal Cloud Services` : `${title} - ${siteName}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={page.url.href} />

	<!-- Open Graph -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:site_name" content={siteName} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
</svelte:head>
