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

const EMAIL_TO_GITHUB = {
	'luiz.benevenuto@gmail.com': 'lbenevenuto',
	'jarvis@openclaw.ai': 'lbenevenuto'
};

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
								if (commit.authorEmail && commit.authorEmail !== 'semantic-release-bot@martynus.net') {
									const gh = EMAIL_TO_GITHUB[commit.authorEmail];
									if (gh) {
										contributors.add(gh);
										commit.githubUser = gh;
									}
								}

								const prRef = (commit.references || []).find((r) => r.prefix === '#' && /^\d+$/.test(r.issue));
								if (prRef) {
									commit.prNumber = prRef.issue;
								}
							}
						}

						const parts = [];

						if (contributors.size > 0) {
							parts.push('## Contributors');
							parts.push('');
							for (const user of [...contributors].sort()) {
								parts.push(`- @${user}`);
							}
						}

						if (context.previousTag && context.currentTag) {
							parts.push('');
							parts.push(
								`**Full Changelog**: https://github.com/${context.owner}/${context.repository}/compare/${context.previousTag}...${context.currentTag}`
							);
						}

						context.extraFooter = parts.join('\n');
						return context;
					},
					commitPartial: [
						'*{{#if scope}} **{{scope}}:**{{/if}} {{#if subject}}{{{subject}}}{{else}}{{{header}}}{{/if}}',
						'{{~#if githubUser}} by @{{githubUser}}{{/if}}',
						'{{~#if prNumber}} in [#{{prNumber}}]({{~@root.host}}/{{~@root.owner}}/{{~@root.repository}}/pull/{{prNumber}}){{/if}}',
						'{{~#unless prNumber}}{{~#if @root.linkReferences}} ([{{shortHash}}]({{commitUrlFormat}})){{else}} {{shortHash}}{{/if}}{{/unless}}\n'
					].join(''),
					footerPartial: [
						'{{#if noteGroups}}',
						'{{#each noteGroups}}',
						'',
						'### {{title}}',
						'',
						'{{#each notes}}',
						'- {{#if commit.scope}}**{{commit.scope}}:** {{/if}}{{text}}',
						'{{/each}}',
						'{{/each}}',
						'{{/if}}',
						'{{extraFooter}}'
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
