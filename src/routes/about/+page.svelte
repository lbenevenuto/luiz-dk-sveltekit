<svelte:head>
	<title>About - URL Shortener</title>
</svelte:head>

<div class="mx-auto max-w-2xl py-12 text-center md:py-20">
	<h1 class="mb-4 text-3xl font-bold text-white md:text-4xl">About luiz.dk</h1>
	<p class="mb-8 text-lg text-gray-300">
		A personal playground for exploring modern web development, serverless architecture, and distributed systems.
	</p>

	<div class="space-y-6 text-left">
		<div class="rounded-2xl border border-gray-700 bg-gray-800 p-8 shadow-xl">
			<h2 class="mb-4 text-xl font-bold text-white">Tech Stack</h2>
			<ul class="space-y-3 text-gray-300">
				<li class="flex items-center gap-3">
					<span class="rounded bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400">Framework</span>
					SvelteKit
				</li>
				<li class="flex items-center gap-3">
					<span class="rounded bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">Runtime</span>
					Bun
				</li>
				<li class="flex items-center gap-3">
					<span class="rounded bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400">Database</span>
					Drizzle ORM + D1
				</li>
				<li class="flex items-center gap-3">
					<span class="rounded bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">Infrastructure</span>
					Cloudflare Pages
				</li>
			</ul>
		</div>

		<div class="rounded-2xl border border-gray-700 bg-gray-800 p-8 shadow-xl">
			<h2 class="mb-4 text-xl font-bold text-white">Philosophy</h2>
			<p class="leading-relaxed text-gray-300">
				The goal of this platform is to build highly performant, type-safe applications that scale automatically. Every
				tool hosted here shares a common design system and authentication layer.
			</p>
		</div>
	</div>
</div>
