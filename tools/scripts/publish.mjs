import { parseArgs } from 'node:util'
import { releasePublish } from 'nx/release/index.js'

const { values: argv } = parseArgs({
  options: {
    dryRun: { type: 'boolean', default: false },
    verbose: { type: 'boolean', default: false },
    projects: { type: 'string' },
  },
  strict: true,
})

if (argv.verbose) {
  console.log('argv:', JSON.stringify(argv, null, 2))
}

const projectsFilter =
  argv.projects
    ?.split(',')
    .map((p) => p.trim())
    .filter(Boolean) ?? []

const results = await releasePublish({
  dryRun: argv.dryRun,
  verbose: argv.verbose,
  projects: projectsFilter,
  firstRelease: argv.firstRelease,
})

const failedPublishes = Object.entries(results)
  .filter(([, result]) => result.code !== 0)
  .map(([projectName]) => projectName)
if (failedPublishes.length > 0) {
  console.error(`Failed to publish ${failedPublishes.length} projects:`)
  for (const projectName of failedPublishes) {
    console.error(`- ${projectName}`)
  }
  process.exit(1)
}
