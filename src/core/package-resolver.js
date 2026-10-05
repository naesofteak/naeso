const { getPackage } = require("./registry");
const { getTarget } = require("./target");

const {
  getLatestVersion,
  getVersionConfig,
  isPackageSupported
} = require("./compatibility");

function resolvePackage(packageName, requestedVersion = null) {
  const pkg = getPackage(packageName);

  if (!pkg) {
    throw new Error(
      `Package '${packageName}' not found.`
    );
  }

  const target = getTarget();

  const version =
    requestedVersion ||
    getLatestVersion(pkg);

  if (!version) {
    throw new Error(
      `No versions available for '${packageName}'.`
    );
  }

  const versionConfig =
    getVersionConfig(pkg, version);

  if (!versionConfig) {
    throw new Error(
      `Version '${version}' not found for '${packageName}'.`
    );
  }

  if (
    !isPackageSupported(
      pkg,
      target.target,
      version
    )
  ) {
    throw new Error(
      `${packageName} ${version} does not support ${target.target}.`
    );
  }

  const targetConfig =
    versionConfig.config.targets[target.target];

  if (!targetConfig) {
    throw new Error(
      `${packageName} ${version} does not support ${target.target}.`
    );
  }

  /*
   * New multi-artifact package format
   */
  if (targetConfig.artifacts) {
    const artifacts = {};

    for (
      const [artifactName, artifactConfig]
      of Object.entries(targetConfig.artifacts)
    ) {
      if (!artifactConfig.url) {
        throw new Error(
          `Artifact '${artifactName}' has no download URL.`
        );
      }

      artifacts[artifactName] = {
        name: artifactName,
        type: artifactConfig.type,
        version: artifactConfig.version || version,
        url: artifactConfig.url,
        sha256Url:
          artifactConfig.sha256Url || null
      };
    }

    return {
      package: pkg,
      version,
      target: target.target,
      artifacts
    };
  }

  /*
   * Backward compatibility with the old
   * single-artifact package format.
   */
  if (targetConfig.url) {
    return {
      package: pkg,
      version,
      target: target.target,

      artifacts: {
        default: {
          name: "default",
          type: "tarball",
          version,
          url: targetConfig.url,
          sha256Url:
            targetConfig.sha256Url || null
        }
      }
    };
  }

  throw new Error(
    `No artifacts defined for ${packageName} ${version} on ${target.target}.`
  );
}

module.exports = {
  resolvePackage
};