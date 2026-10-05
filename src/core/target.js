const {
  getPlatformInfo
} = require("./platform");

function getTarget() {
  const system = getPlatformInfo();

  let platform;

  switch (system.platform) {
    case "darwin":
      platform = "macos";
      break;

    case "linux":
      platform = "linux";
      break;

    case "win32":
      platform = "windows";
      break;

    default:
      platform = system.platform;
  }

  let architecture;

  switch (system.architecture) {
    case "x64":
      architecture = "x86_64";
      break;

    case "arm64":
      architecture = "arm64";
      break;

    case "ia32":
      architecture = "x86";
      break;

    default:
      architecture = system.architecture;
  }

  return {
    platform,
    architecture,
    target: `${platform}-${architecture}`,
    version: system.macosVersion
  };
}

module.exports = {
  getTarget
};