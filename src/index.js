#!/usr/bin/env node

const { Command } = require("commander");

const {
  getPackage,
  searchPackages,
  listPackages
} = require("./core/registry");

const {
  getLatestVersion,
  isPackageSupported,
  getSupportedTargets
} = require("./core/compatibility");

const {
  getPlatformInfo
} = require("./core/platform");

const {
  getTarget
} = require("./core/target");

const {
  resolvePackage
} = require("./core/package-resolver");

const {
  installPackage
} = require("./core/installer");

const {
  downloadPackage
} = require("./core/package-downloader");

const {
  uninstallPackage
} = require("./core/uninstaller");

const mongodbService = require("./services/mongodb");

const program = new Command();

program
  .name("naeso")
  .description("Naesofteak Package Manager")
  .version("1.0.0");


// ============================================================
// SEARCH
// ============================================================

program
  .command("search")
  .argument("[keyword]", "package name or keyword")
  .description("Search the Naeso package registry")
  .action((keyword) => {
    const packages = searchPackages(keyword);

    if (packages.length === 0) {
      console.log("No packages found.");
      return;
    }

    console.log("");
    console.log("Naeso Package Registry");
    console.log("----------------------");

    packages.forEach((packageName) => {
      const pkg = getPackage(packageName);

      if (!pkg) {
        return;
      }

      const version = getLatestVersion(pkg);

      console.log(
        `${pkg.name} ${version} - ${pkg.description}`
      );
    });

    console.log("");
  });


// ============================================================
// INFO
// ============================================================

program
  .command("info")
  .argument("<package>", "package name")
  .description("Show package information")
  .action((packageName) => {
    const pkg = getPackage(packageName);

    if (!pkg) {
      console.log(`Package '${packageName}' not found.`);
      return;
    }

    const version = getLatestVersion(pkg);

    console.log("");
    console.log("Naeso Package Information");
    console.log("-------------------------");
    console.log(`Name:        ${pkg.name}`);
    console.log(`Version:     ${version}`);
    console.log(`Description: ${pkg.description}`);
    console.log(`Category:    ${pkg.category}`);
    console.log(`License:     ${pkg.license}`);
    console.log(`Homepage:    ${pkg.homepage}`);

    console.log("");
    console.log("Supported Targets:");

    const versionConfig =
      pkg.versions?.[version];

    const targets =
      versionConfig?.targets || {};

    Object.entries(targets).forEach(
      ([target, config]) => {
        console.log(`  ${target}`);

        if (config.artifacts) {
          Object.entries(config.artifacts).forEach(
            ([artifactName, artifact]) => {
              console.log(
                `    ${artifactName}: ${artifact.type} ${artifact.version || ""}`
              );
            }
          );
        } else if (config.url) {
          console.log(
            `    default: ${config.url}`
          );
        }
      }
    );

    console.log("");
    console.log("Binaries:");

    const binaries =
      pkg.install?.binaries ||
      pkg.binaries ||
      [];

    binaries.forEach((binary) => {
      console.log(`  ${binary}`);
    });

    console.log("");
  });


// ============================================================
// LIST
// ============================================================

program
  .command("list")
  .description("List packages in the registry")
  .action(() => {
    const packages = listPackages();

    if (packages.length === 0) {
      console.log("No packages found.");
      return;
    }

    console.log("");
    console.log("Available packages:");
    console.log("");

    packages.forEach((packageName) => {
      const pkg = getPackage(packageName);

      if (!pkg) {
        return;
      }

      const version = getLatestVersion(pkg);

      console.log(
        `${pkg.name} ${version}`
      );
    });

    console.log("");
  });


// ============================================================
// UNINSTALL
// ============================================================

program
  .command("uninstall")
  .argument("<package>", "package name")
  .argument("[version]", "optional package version")
  .description("Uninstall a package")
  .action((packageName, version) => {
    try {
      uninstallPackage(
        packageName,
        version
      );
    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// SYSTEM
// ============================================================

program
  .command("system")
  .description("Show system information")
  .action(() => {
    const system = getPlatformInfo();

    console.log("");
    console.log("Naeso System Information");
    console.log("------------------------");
    console.log(`Platform:      ${system.platform}`);
    console.log(`Architecture:  ${system.architecture}`);
    console.log(`macOS Version: ${system.macosVersion}`);
    console.log(`CPU Cores:     ${system.cpuCount}`);
    console.log(`Hostname:      ${system.hostname}`);
    console.log("");
  });


// ============================================================
// TARGET
// ============================================================

program
  .command("target")
  .description("Show the Naeso package target")
  .action(() => {
    const target = getTarget();

    console.log("");
    console.log("Naeso Package Target");
    console.log("--------------------");
    console.log(`Platform:      ${target.platform}`);
    console.log(`Architecture:  ${target.architecture}`);
    console.log(`Target:        ${target.target}`);
    console.log(`OS Version:    ${target.version}`);
    console.log("");
  });


// ============================================================
// CHECK
// ============================================================

program
  .command("check")
  .argument("<package>", "package name")
  .description("Check package compatibility")
  .action((packageName) => {
    const pkg = getPackage(packageName);

    if (!pkg) {
      console.log(`Package '${packageName}' not found.`);
      return;
    }

    const target = getTarget();
    const version = getLatestVersion(pkg);

    const supported = isPackageSupported(
      pkg,
      target.target,
      version
    );

    console.log("");
    console.log("Naeso Package Compatibility");
    console.log("---------------------------");
    console.log(`Package:       ${pkg.name}`);
    console.log(`Version:       ${version}`);
    console.log(`Target:        ${target.target}`);

    if (supported) {
      console.log("Compatibility: SUPPORTED");
    } else {
      console.log("Compatibility: NOT SUPPORTED");
    }

    console.log("");
    console.log("Supported targets:");

    getSupportedTargets(pkg, version).forEach(
      (supportedTarget) => {
        console.log(`  ${supportedTarget}`);
      }
    );

    console.log("");
  });


// ============================================================
// RESOLVE
// ============================================================

program
  .command("resolve")
  .argument("<package>", "package name")
  .argument("[version]", "optional package version")
  .description("Resolve a package for this system")
  .action((packageName, version) => {
    try {
      const result =
        resolvePackage(
          packageName,
          version
        );

      console.log("");
      console.log("Naeso Package Resolution");
      console.log("-------------------------");
      console.log(
        `Package:      ${result.package.name}`
      );
      console.log(
        `Version:      ${result.version}`
      );
      console.log(
        `Target:       ${result.target}`
      );

      console.log("");
      console.log("Artifacts:");

      Object.entries(
        result.artifacts
      ).forEach(
        ([artifactName, artifact]) => {
          console.log("");
          console.log(`  ${artifactName}`);
          console.log(
            `    Type:        ${artifact.type}`
          );
          console.log(
            `    Version:     ${artifact.version || result.version}`
          );
          console.log(
            `    Download:    ${artifact.url}`
          );

          if (artifact.sha256Url) {
            console.log(
              `    SHA-256 URL: ${artifact.sha256Url}`
            );
          } else {
            console.log(
              `    SHA-256 URL: Not registered`
            );
          }
        }
      );

      console.log("");

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// DOWNLOAD
// ============================================================

program
  .command("download")
  .argument("<package>", "package name")
  .argument("[version]", "optional package version")
  .description("Download and verify a package")
  .action(async (packageName, version) => {
    try {
      await downloadPackage(
        packageName,
        version
      );

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// INSTALL
// ============================================================

program
  .command("install")
  .argument("<package>", "package name")
  .argument("[version]", "optional version")
  .description("Install a package")
  .action(async (packageName, version) => {
    try {
      const downloaded =
        await downloadPackage(
          packageName,
          version
        );

      await installPackage(
        packageName,
        downloaded.version,
        downloaded.artifacts
      );

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// START
// ============================================================

program
  .command("start")
  .argument("<package>", "package name")
  .description("Start a package service")
  .action((packageName) => {
    try {
      if (packageName !== "mongodb") {
        throw new Error(
          `Service management for '${packageName}' is not available yet.`
        );
      }

      const result =
        mongodbService.start();

      if (result.started) {
        console.log("");
        console.log("Naeso Service");
        console.log("-------------");
        console.log("Package: mongodb");
        console.log("Status:  STARTED");
        console.log(
          `Service: ${result.label}`
        );
        console.log(
          `Plist:   ${result.plist}`
        );
        console.log("");
      } else {
        console.log("");
        console.log(
          "MongoDB is already running."
        );
        console.log("");
      }

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// STOP
// ============================================================

program
  .command("stop")
  .argument("<package>", "package name")
  .description("Stop a package service")
  .action((packageName) => {
    try {
      if (packageName !== "mongodb") {
        throw new Error(
          `Service management for '${packageName}' is not available yet.`
        );
      }

      const stopped =
        mongodbService.stop();

      console.log("");

      if (stopped) {
        console.log(
          "MongoDB stopped."
        );
      } else {
        console.log(
          "MongoDB is not running."
        );
      }

      console.log("");

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// RESTART
// ============================================================

program
  .command("restart")
  .argument("<package>", "package name")
  .description("Restart a package service")
  .action((packageName) => {
    try {
      if (packageName !== "mongodb") {
        throw new Error(
          `Service management for '${packageName}' is not available yet.`
        );
      }

      mongodbService.restart();

      console.log("");
      console.log(
        "MongoDB restarted."
      );
      console.log("");

    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


// ============================================================
// STATUS
// ============================================================

program
  .command("status")
  .argument("<package>", "package name")
  .description("Show package service status")
  .action((packageName) => {
    try {
      if (packageName !== "mongodb") {
        throw new Error(
          `Service management for '${packageName}' is not available yet.`
        );
      }

      const result =
        mongodbService.status();

      console.log("");
      console.log("Naeso Service Status");
      console.log("--------------------");
      console.log("Package: mongodb");
      console.log(
        `Status:  ${result.loaded ? "RUNNING" : "STOPPED"}`
      );
      console.log(
        `Service: ${result.label}`
      );
      console.log(
        `MongoDB: ${result.mongod}`
      );
      console.log(
        `Data:    ${result.dataDirectory}`
      );
      console.log(
        `Log:     ${result.logFile}`
      );
      console.log("");
      
    } catch (error) {
      console.error("");
      console.error(
        `ERROR: ${error.message}`
      );
      console.error("");
      process.exitCode = 1;
    }
  });


program.parse();