<script lang="ts">
	import { enhance } from '$app/forms';

	interface User {
		id: string;
		firstName: string | null;
		lastName: string | null;
		email: string | undefined;
		role: string;
		createdAt: number;
	}

	let { data } = $props<{ data: { users: User[]; error?: string } }>();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-white">User Management</h1>
		<div class="text-sm text-gray-400">
			Total users: {data.users.length}
		</div>
	</div>

	{#if data.error}
		<div class="rounded-lg border border-red-800 bg-red-900/20 p-4">
			<p class="text-red-400">{data.error}</p>
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg bg-gray-800">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-700">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
							>Name</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
							>Email</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
							>Role</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
							>Joined</th
						>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-300 uppercase"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each data.users as user}
						<tr class="hover:bg-gray-750 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-white">
									{user.firstName || ''}
									{user.lastName || ''}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-300">{user.email || 'N/A'}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-3 py-1 text-xs font-semibold {user.role ===
									'admin'
										? 'bg-indigo-900/50 text-indigo-300'
										: 'bg-gray-700 text-gray-300'}"
								>
									{user.role}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-400">
									{new Date(user.createdAt).toLocaleDateString()}
								</div>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap">
								<div class="flex space-x-2">
									{#if user.role !== 'admin'}
										<form method="POST" action="?/setRole" use:enhance>
											<input type="hidden" name="userId" value={user.id} />
											<input type="hidden" name="role" value="admin" />
											<button
												type="submit"
												class="text-indigo-400 transition-colors hover:text-indigo-300"
											>
												Make Admin
											</button>
										</form>
									{:else}
										<form method="POST" action="?/setRole" use:enhance>
											<input type="hidden" name="userId" value={user.id} />
											<input type="hidden" name="role" value="user" />
											<button
												type="submit"
												class="text-gray-400 transition-colors hover:text-gray-300"
											>
												Remove Admin
											</button>
										</form>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.users.length === 0}
			<div class="px-6 py-12 text-center">
				<p class="text-gray-400">No users found</p>
			</div>
		{/if}
	</div>
</div>
