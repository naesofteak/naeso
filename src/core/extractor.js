const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);

    let stderr = "";

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", reject);

    process.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `${command} failed: ${stderr.trim()}`
          )
        );
      }

      resolve();
    });
  });
}

async function extractTarball(
  archivePath,
  destination
) {
  fs.mkdirSync(destination, {
    recursive: true
  });

  await runCommand(
    "tar",
    [
      "-xzf",
      archivePath,
      "-C",
      destination
    ]
  );

  return destination;
}

async function extractZip(
  archivePath,
  destination
) {
  fs.mkdirSync(destination, {
    recursive: true
  });

  /*
   * macOS provides /usr/bin/ditto.
   * Using ditto avoids requiring Homebrew
   * or an npm ZIP extraction dependency.
   */
  await runCommand(
    "/usr/bin/ditto",
    [
      "-x",
      "-k",
      archivePath,
      destination
    ]
  );

  return destination;
}

async function extractArchive(
  archivePath,
  type,
  destination
) {
  if (!fs.existsSync(archivePath)) {
    throw new Error(
      `Archive not found: ${archivePath}`
    );
  }

  switch (type) {
    case "tarball":
    case "tgz":
      return extractTarball(
        archivePath,
        destination
      );

    case "zip":
      return extractZip(
        archivePath,
        destination
      );

    default:
      throw new Error(
        `Unsupported archive type: ${type}`
      );
  }
}

function findDirectory(
  directory,
  predicate
) {
  const entries = fs.readdirSync(
    directory,
    {
      withFileTypes: true
    }
  );

  return entries.find(
    predicate
  );
}

function findMongoRoot(
  extractDirectory
) {
  const directory =
    findDirectory(
      extractDirectory,
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("mongodb-")
    );

  if (!directory) {
    throw new Error(
      "MongoDB server directory not found after extraction."
    );
  }

  return path.join(
    extractDirectory,
    directory.name
  );
}

function findMongoshRoot(
  extractDirectory
) {
  const directory =
    findDirectory(
      extractDirectory,
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("mongosh-")
    );

  if (!directory) {
    throw new Error(
      "mongosh directory not found after extraction."
    );
  }

  return path.join(
    extractDirectory,
    directory.name
  );
}

function findDatabaseToolsRoot(
  extractDirectory
) {
  const directory =
    findDirectory(
      extractDirectory,
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith(
          "mongodb-database-tools-"
        )
    );

  if (!directory) {
    throw new Error(
      "MongoDB Database Tools directory not found after extraction."
    );
  }

  return path.join(
    extractDirectory,
    directory.name
  );
}

function findBinary(
  rootDirectory,
  binaryName
) {
  const directPath =
    path.join(
      rootDirectory,
      "bin",
      binaryName
    );

  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const alternativePath =
    path.join(
      rootDirectory,
      binaryName
    );

  if (fs.existsSync(alternativePath)) {
    return alternativePath;
  }

  throw new Error(
    `Binary '${binaryName}' not found in ${rootDirectory}.`
  );
}

module.exports = {
  extractTarball,
  extractZip,
  extractArchive,
  findMongoRoot,
  findMongoshRoot,
  findDatabaseToolsRoot,
  findBinary
};