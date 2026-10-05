const fs = require("fs");
const path = require("path");

const launchd = require("./launchd");

const HOME = process.env.HOME;

const LABEL = "com.naesofteak.naeso.mongodb";

const MONGODB_HOME = path.join(
  HOME,
  ".naeso",
  "packages",
  "mongodb",
  "current"
);

const MONGOD = path.join(
  MONGODB_HOME,
  "bin",
  "mongod"
);

const DATA_DIRECTORY = path.join(
  HOME,
  ".naeso",
  "data",
  "mongodb"
);

const LOG_DIRECTORY = path.join(
  HOME,
  ".naeso",
  "logs",
  "mongodb"
);

const LOG_FILE = path.join(
  LOG_DIRECTORY,
  "mongod.log"
);

function ensureDirectories() {
  fs.mkdirSync(DATA_DIRECTORY, {
    recursive: true
  });

  fs.mkdirSync(LOG_DIRECTORY, {
    recursive: true
  });
}

function createPlist() {
  if (!fs.existsSync(MONGOD)) {
    throw new Error(
      `MongoDB binary not found: ${MONGOD}`
    );
  }

  ensureDirectories();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC
  "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">

<plist version="1.0">
<dict>

  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${MONGOD}</string>
    <string>--dbpath</string>
    <string>${DATA_DIRECTORY}</string>
    <string>--logpath</string>
    <string>${LOG_FILE}</string>
    <string>--bind_ip</string>
    <string>127.0.0.1</string>
    <string>--port</string>
    <string>27017</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ProcessType</key>
  <string>Background</string>

  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>

  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>

  <key>WorkingDirectory</key>
  <string>${DATA_DIRECTORY}</string>

</dict>
</plist>
`;
}

function installService() {
  const plist = createPlist();

  const plistPath = launchd.writePlist(
    LABEL,
    plist
  );

  return plistPath;
}

function start() {
  installService();

  const started = launchd.start(LABEL);

  return {
    started,
    label: LABEL,
    plist: launchd.getPlistPath(LABEL)
  };
}

function stop() {
  return launchd.stop(LABEL);
}

function restart() {
  installService();

  launchd.restart(LABEL);

  return true;
}

function status() {
  const result = launchd.status(LABEL);

  return {
    ...result,
    label: LABEL,
    mongod: MONGOD,
    dataDirectory: DATA_DIRECTORY,
    logFile: LOG_FILE
  };
}

module.exports = {
  LABEL,
  MONGOD,
  DATA_DIRECTORY,
  LOG_FILE,
  installService,
  start,
  stop,
  restart,
  status
};