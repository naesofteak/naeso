const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${(
    bytes / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--";
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds =
    Math.ceil(seconds % 60);

  return `${minutes}m ${remainingSeconds}s`;
}

function renderProgress(
  filename,
  downloaded,
  total,
  speed,
  eta
) {
  const width = 40;

  const percentage =
    total > 0
      ? downloaded / total
      : 0;

  const completed =
    Math.round(width * percentage);

  const remaining =
    width - completed;

  const bar =
    "█".repeat(completed) +
    "░".repeat(remaining);

  const percentText =
    `${(percentage * 100).toFixed(0)}%`;

  const line =
    `Downloading ${filename}\n` +
    `[${bar}] ${percentText}  ` +
    `${formatBytes(downloaded)} / ` +
    `${formatBytes(total)}\n` +
    `Speed: ${formatBytes(speed)}/s  ` +
    `ETA: ${formatTime(eta)}`;

  process.stdout.write(
    `\r\x1b[3A\x1b[0J${line}`
  );
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {

    const protocol =
      url.startsWith("https://")
        ? https
        : http;

    const directory =
      path.dirname(destination);

    fs.mkdirSync(directory, {
      recursive: true
    });

    const request =
      protocol.get(url, (response) => {

        // --------------------------------
        // Redirect
        // --------------------------------

        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();

          return downloadFile(
            response.headers.location,
            destination
          )
            .then(resolve)
            .catch(reject);
        }

        // --------------------------------
        // HTTP error
        // --------------------------------

        if (response.statusCode !== 200) {
          response.resume();

          return reject(
            new Error(
              `Download failed: HTTP ${response.statusCode}`
            )
          );
        }

        // --------------------------------
        // Existing file protection
        // --------------------------------

        let file;

        try {
          file = fs.createWriteStream(
            destination,
            {
              flags: "wx"
            }
          );
        } catch (error) {
          return reject(error);
        }

        const total =
          Number(
            response.headers["content-length"]
          ) || 0;

        let downloaded = 0;

        const startTime =
          Date.now();

        console.log("");
        console.log("");
        console.log("");

        response.on("data", (chunk) => {

          downloaded += chunk.length;

          const elapsed =
            (Date.now() - startTime) / 1000;

          const speed =
            elapsed > 0
              ? downloaded / elapsed
              : 0;

          const remaining =
            total > downloaded
              ? total - downloaded
              : 0;

          const eta =
            speed > 0
              ? remaining / speed
              : Infinity;

          renderProgress(
            path.basename(destination),
            downloaded,
            total,
            speed,
            eta
          );
        });

        response.pipe(file);

        response.on("end", () => {
          process.stdout.write("\n\n");
        });

        file.on("finish", () => {

          file.close(() => {
            resolve(destination);
          });
        });

        file.on("error", (error) => {

          file.close();

          fs.unlink(
            destination,
            () => {}
          );

          reject(error);
        });
      });

    request.setTimeout(
      30000,
      () => {
        request.destroy(
          new Error(
            "Download timed out."
          )
        );
      }
    );

    request.on(
      "error",
      reject
    );
  });
}

module.exports = {
  downloadFile
};