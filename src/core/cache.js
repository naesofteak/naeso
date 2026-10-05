const fs = require("fs");
const path = require("path");

const CACHE_ROOT = path.join(
  process.env.HOME,
  ".naeso",
  "cache"
);

function getPackageCachePath(packageName) {
  return path.join(
    CACHE_ROOT,
    packageName
  );
}

function ensurePackageCache(packageName) {
  const cachePath =
    getPackageCachePath(packageName);

  fs.mkdirSync(cachePath, {
    recursive: true
  });

  return cachePath;
}

function getCachedFile(packageName, filename) {
  return path.join(
    getPackageCachePath(packageName),
    filename
  );
}

module.exports = {
  getPackageCachePath,
  ensurePackageCache,
  getCachedFile
};