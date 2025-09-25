import { execSync } from 'node:child_process'
import { releaseChangelog, releaseVersion } from 'nx/release/index.js'

/**
 * Programmatic release flow that inserts a build step between versioning and changelog.
 * Usage examples:
 *   node tools/scripts/release.mjs --projects sdk-js --skip-publish --dryRun
 *   node tools/scripts/release.mjs --specifier patch --projects sdk-js
 */
// Minimal CLI arg parsing to avoid external deps
const rawArgs = process.argv.slice(2)
const argv = { dryRun: false, verbose: false, skipPublish: true }
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i]
  if (a === '--dryRun' || a === '--dry-run' || a === '-d') argv.dryRun = true
  else if (a === '--verbose') argv.verbose = true
  else if (a === '--skipPublish' || a === '--skip-publish') argv.skipPublish = true
  else if (a === '--projects') argv.projects = rawArgs[++i]
  else if (a === '--specifier') argv.specifier = rawArgs[++i]
}

const projectsFilter = argv.projects
  ?.split(',')
  .map((p) => p.trim())
  .filter(Boolean)

const hasUntrackedChanges = execSync('git status --porcelain').toString().trim().length > 0
if (hasUntrackedChanges) {
  console.error('Error: There are untracked changes in the repository.')
  process.exit(1)
}

const { workspaceVersion, projectsVersionData } = await releaseVersion({
  specifier: argv.specifier,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: projectsFilter,
})

// Build selected projects after version bump so generated files can be committed
if (projectsFilter?.length) {
  const projectList = projectsFilter.join(',')
  // Ensure prebuild hooks run via npm scripts in each project
  execSync(`bun nx run-many --tui false -t build -p ${projectList}`, {
    env: { ...process.env, NX_DAEMON: 'false' },
  })
} else {
  execSync('bun nx run-many --tui false -t build', {
    env: { ...process.env, NX_DAEMON: 'false' },
  })
}

execSync('git add .')

await releaseChangelog({
  version: workspaceVersion,
  versionData: projectsVersionData,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: projectsFilter,
})

// Intentionally skipping publish in this custom flow
if (!argv.dryRun) {
  console.log('Note: publish is intentionally skipped in this script.')
}
process.exit(0)
