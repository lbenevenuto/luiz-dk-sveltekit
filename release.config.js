const TYPES = [
	{ type: 'feat', section: '✨ Features' },
	{ type: 'fix', section: '🐛 Bug Fixes' },
	{ type: 'perf', section: '⚡ Performance' },
	{ type: 'docs', section: '📝 Documentation' },
	{ type: 'refactor', section: '♻️ Refactoring' },
	{ type: 'test', section: '✅ Tests' },
	{ type: 'ci', section: '👷 CI/CD' },
	{ type: 'chore', section: '🔧 Chores' },
	{ type: 'style', section: '💄 Styles' },
	{ type: 'build', section: '📦 Build' },
	{ type: 'revert', section: '⏪ Reverts' }
];

/** @type {import('semantic-release').GlobalConfig} */
export default {
	branches: ['main'],
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{
				preset: 'conventionalcommits',
				presetConfig: { types: TYPES },
				releaseRules: [
					{ type: 'docs', release: 'patch' },
					{ type: 'refactor', release: 'patch' },
					{ type: 'style', release: 'patch' },
					{ type: 'ci', release: 'patch' },
					{ type: 'build', release: 'patch' },
					{ type: 'chore', release: 'patch' },
					{ type: 'test', release: 'patch' }
				]
			}
		],
		[
			'@semantic-release/release-notes-generator',
			{
				preset: 'conventionalcommits',
				presetConfig: { types: TYPES },
				writerOpts: {
					commitsSort: ['subject', 'scope'],
					finalizeContext(context) {
						const contributors = new Set();
						for (const group of context.commitGroups) {
							for (const commit of group.commits) {
								if (commit.authorName && commit.authorName !== 'semantic-release-bot') {
									contributors.add(commit.authorName);
								}
							}
						}
						context.contributors = [...contributors].sort();
						return context;
					},
					footerPartial: [
						'{{#if contributors}}',
						'',
						'### 👥 Contributors',
						'',
						'{{#each contributors}}',
						'- {{this}}',
						'{{/each}}',
						'{{/if}}',
						'{{#if noteGroups}}',
						'{{#each noteGroups}}',
						'',
						'### {{title}}',
						'',
						'{{#each notes}}',
						'- {{#if commit.scope}}**{{commit.scope}}:** {{/if}}{{text}}',
						'{{/each}}',
						'{{/each}}',
						'{{/if}}'
					].join('\n')
				}
			}
		],
		[
			'@semantic-release/changelog',
			{
				changelogFile: 'CHANGELOG.md'
			}
		],
		[
			'@semantic-release/npm',
			{
				npmPublish: false
			}
		],
		[
			'@semantic-release/git',
			{
				assets: ['CHANGELOG.md', 'package.json'],
				message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
			}
		],
		'@semantic-release/github'
	]
};
