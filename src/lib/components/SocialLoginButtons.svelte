<script lang="ts">
	import { browser } from '$app/environment';
	import { waitForClerk } from '$lib/client/clerk';
	import { normalizeRedirectPath } from '$lib/client/redirect';

	interface Props {
		loading?: boolean;
		redirectTo?: string;
	}

	let { loading = false, redirectTo = '/' }: Props = $props();

	async function signInWith(strategy: 'oauth_google' | 'oauth_github') {
		if (!browser) return;

		try {
			const clerk = await waitForClerk();
			const safeRedirect = normalizeRedirectPath(redirectTo);
			const callbackUrl = `${window.location.origin}/sso-callback?redirect_url=${encodeURIComponent(safeRedirect)}`;

			// Use snake_case redirect_url as required by Clerk API
			const signUp = await clerk.client.signUp.create({
				strategy,
				redirect_url: callbackUrl
			});

			// Get the external OAuth redirect URL
			const externalAccount = signUp.verifications?.externalAccount;
			const redirectUrl = externalAccount?.externalVerificationRedirectURL;

			if (redirectUrl) {
				window.location.href = redirectUrl.toString();
			}
		} catch (err) {
			console.error('OAuth error:', err);
			const errorCode = (err as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code;

			// Try signIn for existing users
			if (errorCode === 'external_account_exists' || errorCode === 'identifier_already_signed_up') {
				try {
					const clerk = await waitForClerk();
					const safeRedirect = normalizeRedirectPath(redirectTo);
					const callbackUrl = `${window.location.origin}/sso-callback?redirect_url=${encodeURIComponent(safeRedirect)}`;
					const signIn = await clerk.client.signIn.create({
						strategy,
						redirect_url: callbackUrl
					});

					const redirectUrl = signIn.firstFactorVerification?.externalVerificationRedirectURL;
					if (redirectUrl) {
						window.location.href = redirectUrl.toString();
					}
				} catch (signInErr) {
					console.error('SignIn error:', signInErr);
				}
			}
		}
	}
</script>

<div class="mt-6">
	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-gray-700"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="bg-gray-800 px-2 text-gray-400">Or continue with</span>
		</div>
	</div>

	<div class="mt-6 grid grid-cols-2 gap-3">
		<button
			type="button"
			onclick={() => signInWith('oauth_github')}
			disabled={loading}
			class="flex w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:opacity-50"
		>
			<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill-rule="evenodd"
					d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
					clip-rule="evenodd"
				/>
			</svg>
			GitHub
		</button>

		<button
			type="button"
			onclick={() => signInWith('oauth_google')}
			disabled={loading}
			class="flex w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:opacity-50"
		>
			<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
				/>
			</svg>
			Google
		</button>
	</div>
</div>
