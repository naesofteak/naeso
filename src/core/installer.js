const fs = require("fs");
const path = require("path");

const {
  extractArchive,
  findMongoRoot,
  findMongoshRoot,
  findDatabaseToolsRoot,
  findBinary
} = require("./extractor");

const {
  getPackage
} = require("./registry");

const {
  getLatestVersion
} = require("./compatibility");

const {
  configurePath
} = require("./environment");

const NAESO_HOME =
  path.join(
    process.env.HOME,
    ".naeso"
  );


function copyBinary(
  source,
  destination
) {
  fs.copyFileSync(
    source,
    destination
  );

  fs.chmodSync(
    destination,
    0o755
  );
}


function ensureEmptyDirectory(
  directory
) {
  fs.rmSync(
    directory,
    {
      recursive: true,
      force: true
    }
  );

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );
}


async function installPackage(
  packageName,
  version = null,
  downloadedArtifacts
) {
  /*
   * ---------------------------------------
   * Load package
   * ---------------------------------------
   */

  const pkg =
    getPackage(packageName);

  if (!pkg) {
    throw new Error(
      `Package '${packageName}' not found.`
    );
  }


  /*
   * ---------------------------------------
   * Select version
   * ---------------------------------------
   */

  const selectedVersion =
    version ||
    getLatestVersion(pkg);

  if (!selectedVersion) {
    throw new Error(
      `No version available for ${packageName}.`
    );
  }


  /*
   * ---------------------------------------
   * Validate downloaded artifacts
   * ---------------------------------------
   */

  if (
    !downloadedArtifacts ||
    Object.keys(downloadedArtifacts).length === 0
  ) {
    throw new Error(
      "No downloaded artifacts were provided."
    );
  }


  /*
   * ---------------------------------------
   * Package directories
   * ---------------------------------------
   */

  const packageRoot =
    path.join(
      NAESO_HOME,
      "packages",
      packageName,
      selectedVersion
    );

  const extractRoot =
    path.join(
      packageRoot,
      "extract"
    );

  const installDirectory =
    path.join(
      packageRoot,
      "server"
    );

  const dataDirectory =
    path.join(
      NAESO_HOME,
      "data",
      packageName
    );

  const logDirectory =
    path.join(
      NAESO_HOME,
      "logs",
      packageName
    );

  const configDirectory =
    path.join(
      packageRoot,
      "config"
    );


  /*
   * ---------------------------------------
   * Installer header
   * ---------------------------------------
   */

  console.log("");
  console.log(
    "Naeso Package Installer"
  );
  console.log(
    "-----------------------"
  );
  console.log(
    `Package: ${packageName}`
  );
  console.log(
    `Version: ${selectedVersion}`
  );
  console.log("");


  /*
   * ---------------------------------------
   * Prevent duplicate installation
   * ---------------------------------------
   */

  if (
    fs.existsSync(
      installDirectory
    )
  ) {
    throw new Error(
      `${packageName} ${selectedVersion} is already installed.`
    );
  }


  /*
   * ---------------------------------------
   * Create directories
   * ---------------------------------------
   */

  console.log(
    "Creating directories..."
  );

  fs.mkdirSync(
    packageRoot,
    {
      recursive: true
    }
  );

  ensureEmptyDirectory(
    extractRoot
  );

  fs.mkdirSync(
    installDirectory,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    dataDirectory,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    logDirectory,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    configDirectory,
    {
      recursive: true
    }
  );


  /*
   * ---------------------------------------
   * Extract all artifacts
   * ---------------------------------------
   */

  const extracted = {};

  for (
    const [artifactName, artifact]
    of Object.entries(
      downloadedArtifacts
    )
  ) {
    const destination =
      path.join(
        extractRoot,
        artifactName
      );

    console.log(
      `Extracting ${artifactName}...`
    );

    await extractArchive(
      artifact.archive,
      artifact.type,
      destination
    );

    extracted[artifactName] =
      destination;
  }


  /*
   * ---------------------------------------
   * Locate artifact roots
   * ---------------------------------------
   */

  const serverRoot =
    findMongoRoot(
      extracted.server
    );

  const mongoshRoot =
    findMongoshRoot(
      extracted.mongosh
    );

  const databaseToolsRoot =
    findDatabaseToolsRoot(
      extracted.databaseTools
    );

  console.log("");

  console.log(
    `MongoDB server: ${serverRoot}`
  );

  console.log(
    `MongoDB shell:  ${mongoshRoot}`
  );

  console.log(
    `Database tools: ${databaseToolsRoot}`
  );


  /*
   * ---------------------------------------
   * Create final bin directory
   * ---------------------------------------
   */

  const binDirectory =
    path.join(
      installDirectory,
      "bin"
    );

  fs.mkdirSync(
    binDirectory,
    {
      recursive: true
    }
  );


  /*
   * ---------------------------------------
   * Install MongoDB server
   * ---------------------------------------
   */

  console.log("");
  console.log(
    "Installing MongoDB server..."
  );

  copyBinary(
    findBinary(
      serverRoot,
      "mongod"
    ),
    path.join(
      binDirectory,
      "mongod"
    )
  );

  copyBinary(
    findBinary(
      serverRoot,
      "mongos"
    ),
    path.join(
      binDirectory,
      "mongos"
    )
  );


  /*
   * ---------------------------------------
   * Install MongoDB Shell
   * ---------------------------------------
   */

  console.log(
    "Installing MongoDB Shell..."
  );

  copyBinary(
    findBinary(
      mongoshRoot,
      "mongosh"
    ),
    path.join(
      binDirectory,
      "mongosh"
    )
  );


  /*
   * ---------------------------------------
   * Install MongoDB Database Tools
   * ---------------------------------------
   */

  console.log(
    "Installing MongoDB Database Tools..."
  );

  const databaseTools = [
    "mongodump",
    "mongorestore",
    "mongoexport",
    "mongoimport",
    "bsondump",
    "mongostat",
    "mongotop"
  ];

  for (
    const binary of databaseTools
  ) {
    copyBinary(
      findBinary(
        databaseToolsRoot,
        binary
      ),
      path.join(
        binDirectory,
        binary
      )
    );
  }


  /*
   * ---------------------------------------
   * Verify all binaries
   * ---------------------------------------
   */

  const requiredBinaries = [
    "mongod",
    "mongos",
    "mongosh",
    "mongodump",
    "mongorestore",
    "mongoexport",
    "mongoimport",
    "bsondump",
    "mongostat",
    "mongotop"
  ];

  console.log("");
  console.log(
    "Verifying MongoDB binaries..."
  );

  for (
    const binary of requiredBinaries
  ) {
    const binaryPath =
      path.join(
        binDirectory,
        binary
      );

    if (
      !fs.existsSync(
        binaryPath
      )
    ) {
      throw new Error(
        `Required binary not found: ${binary}`
      );
    }

    console.log(
      `  ✓ ${binary}`
    );
  }


  /*
   * ---------------------------------------
   * Create current symlink
   * ---------------------------------------
   */

  const packagesDirectory =
    path.join(
      NAESO_HOME,
      "packages",
      packageName
    );

  const currentLink =
    path.join(
      packagesDirectory,
      "current"
    );

  const currentStat =
    fs.lstatSync(
      currentLink,
      {
        throwIfNoEntry: false
      }
    );

  if (
    currentStat
  ) {
    fs.rmSync(
      currentLink,
      {
        recursive: true,
        force: true
      }
    );
  }

  fs.symlinkSync(
    installDirectory,
    currentLink,
    "dir"
  );


  /*
   * ---------------------------------------
   * Configure environment PATH
   * ---------------------------------------
   */

  const environmentPaths =
    pkg.environment?.path || [];

  if (
    environmentPaths.length > 0
  ) {
    console.log("");
    console.log(
      "Configuring environment..."
    );

    const environmentResult =
      configurePath(
        environmentPaths
      );

    if (
      environmentResult.changed
    ) {
      console.log(
        `PATH updated: ${environmentResult.shellConfig}`
      );

      console.log(
        "Restart your terminal or reload the shell configuration."
      );
    } else {
      console.log(
        "PATH already configured."
      );
    }
  }


  /*
   * ---------------------------------------
   * Installed metadata
   * ---------------------------------------
   */

  const metadata = {
    name: packageName,

    version:
      selectedVersion,

    installedAt:
      new Date().toISOString(),

    installDirectory,

    currentDirectory:
      currentLink,

    binDirectory,

    dataDirectory,

    logDirectory,

    configDirectory,

    environment: {
      path:
        environmentPaths
    },

    binaries:
      Object.fromEntries(
        requiredBinaries.map(
          (binary) => [
            binary,
            path.join(
              binDirectory,
              binary
            )
          ]
        )
      )
  };


  /*
   * ---------------------------------------
   * Save installed metadata
   * ---------------------------------------
   */

  const metadataDirectory =
    path.join(
      NAESO_HOME,
      "installed"
    );

  fs.mkdirSync(
    metadataDirectory,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    path.join(
      metadataDirectory,
      `${packageName}.json`
    ),
    JSON.stringify(
      metadata,
      null,
      2
    )
  );


  /*
   * ---------------------------------------
   * Finished
   * ---------------------------------------
   */

  console.log("");
  console.log(
    `${pkg.displayName || packageName} installation completed.`
  );
  console.log("");

  console.log(
    `Installed: ${installDirectory}`
  );

  console.log(
    `Current:   ${currentLink}`
  );

  console.log(
    `Data:      ${dataDirectory}`
  );

  console.log(
    `Logs:      ${logDirectory}`
  );

  console.log("");

  return metadata;
}


module.exports = {
  installPackage
};