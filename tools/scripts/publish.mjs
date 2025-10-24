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

for (const projectName of projectsFilter) {
  const results = await releasePublish({
    dryRun: argv.dryRun,
    verbose: argv.verbose,
    projects: [projectName],
    firstRelease: argv.firstRelease,
  })
  if (results[projectName].code !== 0) {
    console.error(`Failed to publish ${projectName}`)
    process.exit(1)
  }
}
