<svelte:head>
	<title>luiz.dk - Personal Cloud Services</title>
	<meta
		name="description"
		content="A collection of tools and experiments built with modern web technologies."
	/>
</svelte:head>

<div class="py-12 sm:py-24">
	<div class="mx-auto max-w-7xl px-6 lg:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
				Personal Cloud Services
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-300">
				A collection of tools, experiments, and utilities built with modern web technologies.
				Powered by SvelteKit, Bun, and Cloudflare.
			</p>
			<div class="mt-10 flex items-center justify-center gap-x-6">
				<a
					href="/about"
					class="text-sm leading-6 font-semibold text-white transition-colors hover:text-indigo-400"
				>
					Learn more <span aria-hidden="true">→</span>
				</a>
			</div>
		</div>

		<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
			<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
				<div class="flex flex-col">
					<dt class="flex items-center gap-x-3 text-base leading-7 font-semibold text-white">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
							<span class="text-2xl">🔗</span>
						</div>
						URL Shortener
					</dt>
					<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
						<p class="flex-auto">
							Fast, secure URL shortening with custom aliases and sequential Hashids. Built for
							performance and longevity.
						</p>
						<p class="mt-6">
							<a
								href="/shortener"
								class="text-sm leading-6 font-semibold text-indigo-400 hover:text-indigo-300"
							>
								Start shortening <span aria-hidden="true">→</span>
							</a>
						</p>
					</dd>
				</div>

				<!-- Placeholder for future services -->
				<div class="flex flex-col opacity-50">
					<dt class="flex items-center gap-x-3 text-base leading-7 font-semibold text-white">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
							<span class="text-2xl">🚧</span>
						</div>
						Coming Soon
					</dt>
					<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
						<p class="flex-auto">
							More tools are currently in development. Stay tuned for updates.
						</p>
					</dd>
				</div>

				<div class="flex flex-col opacity-50">
					<dt class="flex items-center gap-x-3 text-base leading-7 font-semibold text-white">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
							<span class="text-2xl">🧪</span>
						</div>
						Labs
					</dt>
					<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
						<p class="flex-auto">
							Experimental projects and proof-of-concepts testing new frameworks.
						</p>
					</dd>
				</div>
			</dl>
		</div>
	</div>
</div>
