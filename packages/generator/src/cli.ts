import { Command } from 'commander'
import { Generator } from './generator.ts'
import * as process from 'process'

interface CliOptions {
  url: string
}

const program = new Command()

program
  .name('gladia-generator')
  .description('Generate SDK code from OpenAPI schema')
  .version('1.0.0')
  .option(
    '-u, --url <url>',
    'OpenAPI schema URL',
    // 'https://api.gladia.io/openapi.json'
    'http://localhost:3000/openapi.json'
  )
  .action(async (options: CliOptions) => {
    try {
      const generator = new Generator({
        schemaUrl: options.url,
      })

      await generator.generate()
      console.log('✅ Code generation completed successfully!')
    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  })

program.parse()
