const fs = require("fs");
const path = require("path");

const {
  resolvePackage
} = require("./package-resolver");

const {
  downloadFile
} = require("./downloader");

const {
  calculateSHA256
} = require("./checksum");

const {
  ensurePackageCache,
  getCachedFile
} = require("./cache");

async function verifyArtifact(
  artifact,
  archivePath,
  packageName
) {
  /*
   * If the registry provides an official SHA-256 URL,
   * download and verify it.
   */
  if (artifact.sha256Url) {
    const archiveName =
      path.basename(
        new URL(artifact.url).pathname
      );

    const checksumName =
      `${archiveName}.sha256`;

    const checksumPath =
      getCachedFile(
        packageName,
        checksumName
      );

    if (fs.existsSync(checksumPath)) {
      console.log(
        `Checksum file already exists: ${checksumPath}`
      );
    } else {
      console.log(
        "Downloading official SHA-256 checksum..."
      );

      await downloadFile(
        artifact.sha256Url,
        checksumPath
      );

      console.log(
        `Downloaded: ${checksumPath}`
      );
    }

    const checksumText =
      fs.readFileSync(
        checksumPath,
        "utf8"
      ).trim();

    const expectedHash =
      checksumText
        .split(/\s+/)[0]
        .toLowerCase();

    if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
      throw new Error(
        `Invalid SHA-256 checksum for ${artifact.name}.`
      );
    }

    console.log(
      `Expected SHA-256: ${expectedHash}`
    );

    console.log(
      "Calculating downloaded archive SHA-256..."
    );

    const actualHash =
      (
        await calculateSHA256(
          archivePath
        )
      ).toLowerCase();

    console.log(
      `Actual SHA-256:   ${actualHash}`
    );

    if (actualHash !== expectedHash) {
      fs.unlinkSync(archivePath);

      throw new Error(
        `${artifact.name} failed SHA-256 verification.`
      );
    }

    console.log(
      `${artifact.name} SHA-256 verification PASSED.`
    );

    return {
      verified: true,
      checksum: expectedHash
    };
  }

  /*
   * No official checksum URL is registered yet.
   *
   * We still calculate the local SHA-256 so that the
   * artifact gets a deterministic fingerprint.
   */
  console.log(
    `No official SHA-256 URL registered for ${artifact.name}.`
  );

  const actualHash =
    (
      await calculateSHA256(
        archivePath
      )
    ).toLowerCase();

  console.log(
    `SHA-256: ${actualHash}`
  );

  return {
    verified: false,
    checksum: actualHash
  };
}

async function downloadArtifact(
  packageName,
  artifact
) {
  const cacheDirectory =
    ensurePackageCache(
      packageName
    );

  const archiveName =
    path.basename(
      new URL(artifact.url).pathname
    );

  const archivePath =
    getCachedFile(
      packageName,
      archiveName
    );

  console.log("");
  console.log(
    `Artifact: ${artifact.name}`
  );
  console.log(
    `Type:     ${artifact.type}`
  );
  console.log(
    `Version:  ${artifact.version}`
  );
  console.log(
    `URL:      ${artifact.url}`
  );
  console.log("");

  if (fs.existsSync(archivePath)) {
    console.log(
      `Archive already exists: ${archivePath}`
    );
  } else {
    console.log(
      `Downloading ${archiveName}...`
    );

    await downloadFile(
      artifact.url,
      archivePath
    );

    console.log(
      `Downloaded: ${archivePath}`
    );
  }

  const verification =
    await verifyArtifact(
      artifact,
      archivePath,
      packageName
    );

  return {
    ...artifact,
    archive: archivePath,
    checksum: verification.checksum,
    verified: verification.verified
  };
}

async function downloadPackage(
  packageName,
  requestedVersion = null
) {
  const resolved =
    resolvePackage(
      packageName,
      requestedVersion
    );

  const {
    package: pkg,
    version,
    target,
    artifacts
  } = resolved;

  console.log("");
  console.log(
    "Naeso Package Download"
  );
  console.log(
    "----------------------"
  );
  console.log(
    `Package: ${pkg.name}`
  );
  console.log(
    `Version: ${version}`
  );
  console.log(
    `Target:  ${target}`
  );
  console.log("");

  const downloaded = {};

  for (
    const [artifactName, artifact]
    of Object.entries(artifacts)
  ) {
    const artifactWithName = {
      ...artifact,
      name: artifactName
    };

    downloaded[artifactName] =
      await downloadArtifact(
        packageName,
        artifactWithName
      );
  }

  console.log("");
  console.log(
    "All MongoDB artifacts downloaded."
  );
  console.log("");

  return {
    package: pkg.name,
    version,
    target,
    artifacts: downloaded
  };
}

module.exports = {
  downloadPackage,
  downloadArtifact
};