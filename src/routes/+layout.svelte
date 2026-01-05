<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div
	class="flex h-screen flex-col overflow-hidden bg-gray-900 font-sans text-gray-100 selection:bg-indigo-500 selection:text-white"
>
	<nav class="relative z-50 flex-none border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center">
					<a href="/" class="flex-shrink-0">
						<span class="text-xl font-bold text-indigo-500">🔗 luiz.dk</span>
					</a>
					<div class="hidden md:block">
						<div class="ml-10 flex items-baseline space-x-4">
							<a
								href="/"
								class="rounded-md px-3 py-2 text-sm font-medium transition-colors {$page.url
									.pathname === '/'
									? 'bg-gray-900 text-white'
									: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
							>
								Home
							</a>
							<a
								href="/shortener"
								class="rounded-md px-3 py-2 text-sm font-medium transition-colors {$page.url.pathname.startsWith(
									'/shortener'
								)
									? 'bg-gray-900 text-white'
									: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
							>
								Shortener
							</a>
							<a
								href="/about"
								class="rounded-md px-3 py-2 text-sm font-medium transition-colors {$page.url
									.pathname === '/about'
									? 'bg-gray-900 text-white'
									: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
							>
								About
							</a>
						</div>
					</div>
				</div>
				<!-- Mobile menu button placeholder -->
				<div class="-mr-2 flex md:hidden">
					<button
						type="button"
						class="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
					>
						<span class="sr-only">Open main menu</span>
						<!-- Heroicon name: outline/bars-3 -->
						<svg
							class="block h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</nav>

	<main class="w-full flex-1 overflow-y-auto">
		<div class="container mx-auto h-full px-4 py-8">
			{@render children()}
		</div>
	</main>
</div>
