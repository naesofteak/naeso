const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;

const LAUNCH_AGENTS_DIR = path.join(
  HOME,
  "Library",
  "LaunchAgents"
);

function getPlistPath(label) {
  return path.join(
    LAUNCH_AGENTS_DIR,
    `${label}.plist`
  );
}

function ensureLaunchAgentsDirectory() {
  fs.mkdirSync(
    LAUNCH_AGENTS_DIR,
    { recursive: true }
  );
}

function writePlist(label, plistContent) {
  ensureLaunchAgentsDirectory();

  const plistPath = getPlistPath(label);

  fs.writeFileSync(
    plistPath,
    plistContent,
    "utf8"
  );

  return plistPath;
}

function load(label) {
  const plistPath = getPlistPath(label);

  if (!fs.existsSync(plistPath)) {
    throw new Error(
      `Service plist not found: ${plistPath}`
    );
  }

  const result = spawnSync(
    "launchctl",
    ["load", plistPath],
    {
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
      `Failed to load service '${label}'.`
    );
  }
}

function unload(label) {
  const plistPath = getPlistPath(label);

  if (!fs.existsSync(plistPath)) {
    return;
  }

  const result = spawnSync(
    "launchctl",
    ["unload", plistPath],
    {
      encoding: "utf8"
    }
  );

  if (
    result.status !== 0 &&
    !result.stderr.includes("Could not find service")
  ) {
    throw new Error(
      result.stderr.trim() ||
      `Failed to unload service '${label}'.`
    );
  }
}

function isLoaded(label) {
  const result = spawnSync(
    "launchctl",
    ["list", label],
    {
      encoding: "utf8"
    }
  );

  return result.status === 0;
}

function start(label) {
  const plistPath = getPlistPath(label);

  if (!fs.existsSync(plistPath)) {
    throw new Error(
      `Service '${label}' is not installed.`
    );
  }

  if (isLoaded(label)) {
    return false;
  }

  load(label);

  return true;
}

function stop(label) {
  if (!isLoaded(label)) {
    return false;
  }

  unload(label);

  return true;
}

function restart(label) {
  if (isLoaded(label)) {
    unload(label);
  }

  load(label);

  return true;
}

function status(label) {
  const result = spawnSync(
    "launchctl",
    ["list", label],
    {
      encoding: "utf8"
    }
  );

  if (result.status !== 0) {
    return {
      loaded: false,
      output: ""
    };
  }

  return {
    loaded: true,
    output: result.stdout.trim()
  };
}

module.exports = {
  getPlistPath,
  writePlist,
  load,
  unload,
  isLoaded,
  start,
  stop,
  restart,
  status
};