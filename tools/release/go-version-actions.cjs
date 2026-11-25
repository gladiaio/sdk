// Nx release version actions for Go modules (packages/sdk-go).
//
// A Go module has no version in go.mod: the version is the git tag
// (`packages/sdk-go/vX.Y.Z`, created by the project's nx-release-publish target).
// The version used by `nx release version` and the SDK's x-gladia-version header lives in
// `sdk.version`; `version:write` regenerates `version/version.go` from it.

const { join } = require('node:path')
const { VersionActions } = require('nx/release')

const MANIFEST = 'sdk.version'

class GoVersionActions extends VersionActions {
  validManifestFilenames = [MANIFEST]

  async readCurrentVersionFromSourceManifest(tree) {
    const manifestPath = join(this.projectGraphNode.data.root, MANIFEST)
    const currentVersion = tree.read(manifestPath, 'utf-8')?.trim()
    if (!currentVersion) {
      throw new Error(
        `Unable to read the current version of "${this.projectGraphNode.name}" from ${manifestPath}`
      )
    }
    return { currentVersion, manifestPath }
  }

  // Go has no registry to query: the proxy only mirrors git tags, which Nx resolves itself
  // with currentVersionResolver "git-tag".
  async readCurrentVersionFromRegistry() {
    return null
  }

  // Go modules of this repository do not depend on each other through Nx.
  async readCurrentVersionOfDependency() {
    return { currentVersion: null, dependencyCollection: null }
  }

  async updateProjectVersion(tree, newVersion) {
    const logs = []
    for (const { manifestPath } of this.manifestsToUpdate) {
      tree.write(manifestPath, `${newVersion}\n`)
      logs.push(`✍️  New version ${newVersion} written to manifest: ${manifestPath}`)
    }
    return logs
  }

  async updateProjectDependencies() {
    return []
  }
}

module.exports = GoVersionActions
module.exports.default = GoVersionActions
