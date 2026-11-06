import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { releaseChangelog, releaseVersion } from 'nx/release/index.js'

// Bumps the version of one project and writes its changelog entry, without committing,
// tagging or pushing: the release workflow commits the changes on a release branch and
// opens a pull request, and the tag is created when the merged pull request is published.

const { values: argv } = parseArgs({
  options: {
    dryRun: { type: 'boolean', default: false },
    verbose: { type: 'boolean', default: false },
    project: { type: 'string' },
    version: { type: 'string' },
  },
  strict: true,
})

if (argv.verbose) {
  console.log('argv:', JSON.stringify(argv, null, 2))
}

if (!argv.project || !/^\d+\.\d+\.\d+$/.test(argv.version ?? '')) {
  console.error('Usage: bun run release -- --project <sdk-js|sdk-python> --version X.Y.Z')
  process.exit(1)
}

if (!argv.dryRun) {
  const changes = execSync('git status --porcelain').toString().trim()
  if (changes.length > 0) {
    console.error('Error: There are untracked changes in the repository.', changes)
    process.exit(1)
  }
}

const git = { gitCommit: false, gitTag: false, gitPush: false, stageChanges: false }

const { workspaceVersion, projectsVersionData } = await releaseVersion({
  ...git,
  specifier: argv.version,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: [argv.project],
})

if (!argv.dryRun) {
  // Regenerate the version file and lockfiles from the bumped manifest
  execSync(`bun nx run-many --tui false -t version:write -p ${argv.project}`, {
    env: { ...process.env, NX_DAEMON: 'false' },
    stdio: 'inherit',
  })
}

await releaseChangelog({
  ...git,
  createRelease: false,
  version: workspaceVersion,
  versionData: projectsVersionData,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: [argv.project],
})

process.exit(0)
