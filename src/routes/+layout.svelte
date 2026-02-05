<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toast from '$lib/components/Toast.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { dark } from '@clerk/themes';
	import { isPublicRoute } from '$lib/routes/public';

	interface LayoutData {
		clerkPublishableKey: string;
		clerkFrontendApi: string;
	}

	let {
		children,
		data
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		children: any;
		data: LayoutData;
	} = $props();

	let isMobileMenuOpen = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let user = $state<any>(null);
	const RAW_NAV_LINKS = [
		{ path: '/', label: 'Home' },
		{ path: '/shortener', label: 'Shortener' },
		{ path: '/about', label: 'About' }
	] as const;
	const NAV_LINKS = RAW_NAV_LINKS.filter((link): link is (typeof RAW_NAV_LINKS)[number] =>
		isPublicRoute(link.path)
	).map((link) => ({ ...link, href: resolve(link.path) }));

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	onMount(async () => {
		if (!browser || !data.clerkPublishableKey) {
			console.warn('Not in browser or missing publishable key');
			return;
		}

		// Wait for Clerk script to load (it's async)
		const waitForClerk = async () => {
			let attempts = 0;
			const maxAttempts = 50; // 5 seconds max (50 * 100ms)

			while (!window.Clerk && attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				attempts++;
			}

			if (!window.Clerk) {
				console.error('Clerk script failed to load after 5 seconds');
				return false;
			}

			return true;
		};

		try {
			const clerkAvailable = await waitForClerk();

			if (!clerkAvailable || !window.Clerk) {
				console.error('Clerk not available after timeout');
				return;
			}

			await window.Clerk.load({
				publishableKey: data.clerkPublishableKey,
				appearance: {
					baseTheme: dark
				}
			});

			// Listen for user changes
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			window.Clerk.addListener((resources: any) => {
				user = resources.user;
			});

			user = window.Clerk.user;
		} catch (error) {
			console.error('Failed to load Clerk:', error);
		}
	});

	async function handleSignOut() {
		if (window.Clerk) {
			await window.Clerk.signOut();
			window.location.href = '/';
		}
	}

	$effect(() => {
		// Check if user is admin
	});

	function linkClasses(href: string, mobile = false) {
		const active = page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
		const base = mobile
			? 'block rounded-md px-3 py-2 text-base font-medium transition-colors'
			: 'rounded-md px-3 py-2 text-sm font-medium transition-colors';
		const activeClass = active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
		return `${base} ${activeClass}`;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<!-- Rest of your HTML file -->

	<script
		async
		crossorigin="anonymous"
		data-clerk-publishable-key={data.clerkPublishableKey}
		src={`https://${data.clerkFrontendApi}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`}
		type="text/javascript"
	></script>
</svelte:head>

<div
	class="flex h-screen flex-col overflow-hidden bg-gray-900 font-sans text-gray-100 selection:bg-indigo-500 selection:text-white"
>
	<nav class="relative z-50 flex-none border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center">
					<a href={resolve('/')} class="flex-shrink-0">
						<span class="text-xl font-bold text-indigo-500">🔗 luiz.dk</span>
					</a>
					<div class="hidden md:block">
						<div class="ml-10 flex items-baseline space-x-4">
							{#each NAV_LINKS as link (link.href)}
								<a href={link.href} class={linkClasses(link.href)}>
									{link.label}
								</a>
							{/each}
							{#if user}
								<a href={resolve('/dashboard')} class={linkClasses('/dashboard')}> Dashboard </a>
							{/if}
							{#if user && user.publicMetadata?.role === 'admin'}
								<a
									href={resolve('/admin/analytics')}
									class="rounded-md px-3 py-2 text-sm font-medium transition-colors {page.url.pathname.startsWith(
										'/admin'
									)
										? 'bg-gray-900 text-white'
										: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
								>
									Admin
								</a>
							{/if}
						</div>
					</div>
				</div>

				<!-- Auth buttons (desktop) -->
				<div class="hidden items-center space-x-4 md:flex">
					{#if user}
						<!-- User menu -->
						<div class="flex items-center space-x-3">
							<a href={resolve('/profile')} class="text-sm text-gray-300 transition-colors hover:text-white">
								{user.firstName || user.emailAddresses?.[0]?.emailAddress}
							</a>
							<button
								onclick={handleSignOut}
								class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
							>
								Sign Out
							</button>
						</div>
					{:else}
						<!-- Sign in/up buttons - always show -->
						<a
							href={resolve('/login')}
							class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
						>
							Sign In
						</a>
						<a
							href={resolve('/register')}
							class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
						>
							Sign Up
						</a>
					{/if}
				</div>

				<!-- Mobile menu button -->
				<div class="-mr-2 flex md:hidden">
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
						aria-controls="mobile-menu"
						aria-expanded={isMobileMenuOpen}
						onclick={toggleMobileMenu}
					>
						<span class="sr-only">Open main menu</span>
						{#if !isMobileMenuOpen}
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
							</svg>
						{:else}
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if isMobileMenuOpen}
			<div class="md:hidden" id="mobile-menu">
				<div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
					{#each NAV_LINKS as link (link.href)}
						<a href={link.href} class={linkClasses(link.href, true)} onclick={toggleMobileMenu}>
							{link.label}
						</a>
					{/each}
					{#if user}
						<a href={resolve('/dashboard')} class={linkClasses('/dashboard', true)} onclick={toggleMobileMenu}>
							Dashboard
						</a>
					{/if}
					{#if user && user.publicMetadata?.role === 'admin'}
						<a
							href={resolve('/admin/analytics')}
							class="block rounded-md px-3 py-2 text-base font-medium transition-colors {page.url.pathname.startsWith(
								'/admin'
							)
								? 'bg-gray-900 text-white'
								: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
							onclick={toggleMobileMenu}
						>
							Admin
						</a>
					{/if}

					<!-- Mobile auth -->
					{#if user}
						<div class="mt-4 border-t border-gray-700 pt-4">
							<a
								href={resolve('/profile')}
								class="block px-3 py-2 text-sm text-gray-400 hover:text-white"
								onclick={toggleMobileMenu}
							>
								{user.firstName || user.emailAddresses?.[0]?.emailAddress}
							</a>
							<button
								onclick={handleSignOut}
								class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
							>
								Sign Out
							</button>
						</div>
					{:else}
						<div class="mt-4 space-y-1 border-t border-gray-700 pt-4">
							<a
								href={resolve('/login')}
								class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
								onclick={toggleMobileMenu}
							>
								Sign In
							</a>
							<a
								href={resolve('/register')}
								class="block rounded-md bg-indigo-600 px-3 py-2 text-base font-medium text-white hover:bg-indigo-700"
								onclick={toggleMobileMenu}
							>
								Sign Up
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</nav>

	<main class="w-full flex-1 overflow-y-auto">
		<div class="container mx-auto h-full px-4 py-8">
			{@render children()}
		</div>
	</main>
</div>

<Toast />
