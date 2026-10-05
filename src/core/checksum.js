const fs = require("fs");
const crypto = require("crypto");

function calculateSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", reject);
  });
}

async function verifySHA256(filePath, expectedHash) {
  const actualHash = await calculateSHA256(filePath);

  return (
    actualHash.toLowerCase() ===
    expectedHash.toLowerCase()
  );
}

module.exports = {
  calculateSHA256,
  verifySHA256
};