const fs = require("fs");
const path = require("path");

const {
  getPackage
} = require("./registry");

const {
  getLatestVersion
} = require("./compatibility");

const {
  removePath
} = require("./environment");

const NAESO_HOME =
  path.join(
    process.env.HOME,
    ".naeso"
  );


function removeDirectory(directory) {
  if (
    fs.existsSync(directory)
  ) {
    fs.rmSync(
      directory,
      {
        recursive: true,
        force: true
      }
    );

    return true;
  }

  return false;
}


function removeFile(file) {
  if (
    fs.existsSync(file)
  ) {
    fs.rmSync(
      file,
      {
        force: true
      }
    );

    return true;
  }

  return false;
}


function uninstallPackage(
  packageName,
  version = null
) {
  const pkg =
    getPackage(packageName);

  if (!pkg) {
    throw new Error(
      `Package '${packageName}' not found.`
    );
  }


  /*
   * ---------------------------------------
   * Find installed metadata
   * ---------------------------------------
   */

  const metadataPath =
    path.join(
      NAESO_HOME,
      "installed",
      `${packageName}.json`
    );

  let metadata = null;

  if (
    fs.existsSync(
      metadataPath
    )
  ) {
    metadata =
      JSON.parse(
        fs.readFileSync(
          metadataPath,
          "utf8"
        )
      );
  }


  /*
   * ---------------------------------------
   * Determine installed version
   * ---------------------------------------
   */

  const selectedVersion =
    version ||
    metadata?.version ||
    getLatestVersion(pkg);


  /*
   * ---------------------------------------
   * Paths
   * ---------------------------------------
   */

  const packageDirectory =
    path.join(
      NAESO_HOME,
      "packages",
      packageName
    );

  const versionDirectory =
    path.join(
      packageDirectory,
      selectedVersion
    );

  const currentLink =
    path.join(
      packageDirectory,
      "current"
    );

  const dataDirectory =
    metadata?.dataDirectory ||
    path.join(
      NAESO_HOME,
      "data",
      packageName
    );

  const logDirectory =
    metadata?.logDirectory ||
    path.join(
      NAESO_HOME,
      "logs",
      packageName
    );

  const configDirectory =
    metadata?.configDirectory ||
    path.join(
      versionDirectory,
      "config"
    );


  /*
   * ---------------------------------------
   * Check installation
   * ---------------------------------------
   */

  if (
    !metadata &&
    !fs.existsSync(
      versionDirectory
    ) &&
    !fs.existsSync(
      currentLink
    )
  ) {
    throw new Error(
      `Package '${packageName}' is not installed.`
    );
  }


  /*
   * ---------------------------------------
   * Header
   * ---------------------------------------
   */

  console.log("");
  console.log(
    "Naeso Package Uninstaller"
  );
  console.log(
    "-------------------------"
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
   * Remove current symlink
   * ---------------------------------------
   */

  console.log(
    "Removing current symlink..."
  );

  removeFile(
    currentLink
  );


  /*
   * ---------------------------------------
   * Remove installed package
   * ---------------------------------------
   */

  console.log(
    "Removing installed package..."
  );

  removeDirectory(
    versionDirectory
  );


  /*
   * ---------------------------------------
   * Remove package directory
   * ---------------------------------------
   */

  if (
    fs.existsSync(
      packageDirectory
    )
  ) {
    const remaining =
      fs.readdirSync(
        packageDirectory
      );

    if (
      remaining.length === 0
    ) {
      fs.rmdirSync(
        packageDirectory
      );
    }
  }


  /*
   * ---------------------------------------
   * Remove data
   * ---------------------------------------
   */

  console.log(
    "Removing data directory..."
  );

  removeDirectory(
    dataDirectory
  );


  /*
   * ---------------------------------------
   * Remove logs
   * ---------------------------------------
   */

  console.log(
    "Removing log directory..."
  );

  removeDirectory(
    logDirectory
  );


  /*
   * ---------------------------------------
   * Remove configuration
   * ---------------------------------------
   */

  console.log(
    "Removing configuration..."
  );

  removeDirectory(
    configDirectory
  );


  /*
   * ---------------------------------------
   * Remove metadata
   * ---------------------------------------
   */

  console.log(
    "Removing installation metadata..."
  );

  removeFile(
    metadataPath
  );


  /*
   * ---------------------------------------
   * Remove PATH configuration
   * ---------------------------------------
   */

  const environmentPaths =
    pkg.environment?.path || [];

  if (
    environmentPaths.length > 0
  ) {
    console.log(
      "Removing Naeso PATH configuration..."
    );

    const environmentResult =
      removePath(
        environmentPaths
      );

    if (
      environmentResult.changed
    ) {
      console.log(
        `PATH updated: ${environmentResult.shellConfig}`
      );
    } else {
      console.log(
        "PATH entry was not present."
      );
    }
  }


  /*
   * ---------------------------------------
   * Finished
   * ---------------------------------------
   */

  console.log("");
  console.log(
    `${pkg.displayName || packageName} uninstalled successfully.`
  );

  console.log("");
  console.log(
    "Download cache was preserved."
  );

  console.log("");

  return {
    package: packageName,
    version: selectedVersion
  };
}


module.exports = {
  uninstallPackage
};