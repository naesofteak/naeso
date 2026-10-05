const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(
  __dirname,
  "..",
  "registry",
  "packages"
);

function getPackagePath(packageName) {
  return path.join(
    REGISTRY_PATH,
    packageName,
    "package.json"
  );
}

function getPackage(packageName) {
  const packagePath = getPackagePath(packageName);

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(packagePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(
      `Invalid package definition: ${packageName}`
    );
  }
}

function packageExists(packageName) {
  return fs.existsSync(getPackagePath(packageName));
}

function listPackages() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return [];
  }

  return fs
    .readdirSync(REGISTRY_PATH, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function searchPackages(keyword) {
  const packages = listPackages();

  if (!keyword) {
    return packages;
  }

  const search = keyword.toLowerCase();

  return packages.filter((packageName) =>
    packageName.toLowerCase().includes(search)
  );
}

module.exports = {
  getPackage,
  packageExists,
  listPackages,
  searchPackages
};