const os = require("os");
const { execSync } = require("child_process");

function getPlatform() {
  return process.platform;
}

function getArchitecture() {
  return process.arch;
}

function getMacOSVersion() {
  if (process.platform !== "darwin") {
    return null;
  }

  try {
    return execSync("sw_vers -productVersion")
      .toString()
      .trim();
  } catch (error) {
    return null;
  }
}

function getPlatformInfo() {
  return {
    platform: getPlatform(),
    architecture: getArchitecture(),
    macosVersion: getMacOSVersion(),
    hostname: os.hostname(),
    cpuCount: os.cpus().length
  };
}

module.exports = {
  getPlatform,
  getArchitecture,
  getMacOSVersion,
  getPlatformInfo
};