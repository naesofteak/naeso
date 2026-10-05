function getLatestVersion(pkg) {
  const versions = Object.keys(
    pkg.versions || {}
  );

  if (versions.length === 0) {
    return null;
  }

  return versions.sort(compareVersions).at(-1);
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;

    if (av !== bv) {
      return av - bv;
    }
  }

  return 0;
}

function getVersionConfig(
  pkg,
  version = null
) {
  const selectedVersion =
    version || getLatestVersion(pkg);

  if (!selectedVersion) {
    return null;
  }

  const config =
    pkg.versions[selectedVersion];

  if (!config) {
    return null;
  }

  return {
    version: selectedVersion,
    config
  };
}

function isPackageSupported(
  pkg,
  target,
  version = null
) {
  const versionConfig =
    getVersionConfig(pkg, version);

  if (!versionConfig) {
    return false;
  }

  const targetConfig =
    versionConfig.config.targets?.[target];

  if (!targetConfig) {
    return false;
  }

  /*
   * Multi-artifact package
   */
  if (targetConfig.artifacts) {
    const artifacts =
      Object.values(targetConfig.artifacts);

    return (
      artifacts.length > 0 &&
      artifacts.every(
        (artifact) =>
          artifact &&
          typeof artifact.url === "string" &&
          artifact.url.length > 0
      )
    );
  }

  /*
   * Legacy single-artifact package
   */
  return Boolean(
    targetConfig.url
  );
}

function getSupportedTargets(
  pkg,
  version = null
) {
  const versionConfig =
    getVersionConfig(pkg, version);

  if (!versionConfig) {
    return [];
  }

  return Object.keys(
    versionConfig.config.targets || {}
  );
}

function getArtifacts(
  pkg,
  target,
  version = null
) {
  const versionConfig =
    getVersionConfig(pkg, version);

  if (!versionConfig) {
    return null;
  }

  const targetConfig =
    versionConfig.config.targets?.[target];

  if (!targetConfig) {
    return null;
  }

  if (targetConfig.artifacts) {
    return targetConfig.artifacts;
  }

  if (targetConfig.url) {
    return {
      default: targetConfig
    };
  }

  return null;
}

module.exports = {
  getLatestVersion,
  getVersionConfig,
  isPackageSupported,
  getSupportedTargets,
  getArtifacts
};