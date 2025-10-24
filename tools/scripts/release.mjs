import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { releaseChangelog, releaseVersion } from 'nx/release/index.js'

const { values: argv } = parseArgs({
  options: {
    dryRun: { type: 'boolean', default: false },
    verbose: { type: 'boolean', default: false },
    projects: { type: 'string' },
    specifier: { type: 'string' },
    firstRelease: { type: 'boolean', default: false },
  },
  strict: true,
})

if (argv.verbose) {
  console.log('argv:', JSON.stringify(argv, null, 2))
}

const projectsFilter = argv.projects
  ?.split(',')
  .map((p) => p.trim())
  .filter(Boolean)

if (!argv.dryRun) {
  const changes = execSync('git status --porcelain').toString().trim()
  if (changes.length > 0) {
    console.error('Error: There are untracked changes in the repository.', changes)
    process.exit(1)
  }
}

const { workspaceVersion, projectsVersionData } = await releaseVersion({
  specifier: argv.specifier,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: projectsFilter,
  firstRelease: argv.firstRelease,
})

if (!argv.dryRun) {
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
}

const { projectChangelogs } = await releaseChangelog({
  version: workspaceVersion,
  versionData: projectsVersionData,
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: projectsFilter,
  firstRelease: argv.firstRelease,
})

const releasedProjects = Object.keys(projectChangelogs)
if (argv.verbose) {
  console.log('releasedProjects:', releasedProjects)
}

process.exit(0)
