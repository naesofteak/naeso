const fs = require("fs");
const path = require("path");


function expandHome(value) {
  if (!value) {
    return value;
  }

  if (value === "~") {
    return process.env.HOME;
  }

  if (value.startsWith("~/")) {
    return path.join(
      process.env.HOME,
      value.slice(2)
    );
  }

  return value;
}


function getShellConfigFile() {
  const shell =
    process.env.SHELL || "";

  if (
    shell.endsWith("/zsh")
  ) {
    return path.join(
      process.env.HOME,
      ".zprofile"
    );
  }

  if (
    shell.endsWith("/bash")
  ) {
    return path.join(
      process.env.HOME,
      ".bash_profile"
    );
  }

  return path.join(
    process.env.HOME,
    ".profile"
  );
}


function configurePath(paths) {
  if (
    !Array.isArray(paths)
  ) {
    return {
      shellConfig:
        getShellConfigFile(),
      changed: false
    };
  }

  const shellConfig =
    getShellConfigFile();

  let content = "";

  if (
    fs.existsSync(
      shellConfig
    )
  ) {
    content =
      fs.readFileSync(
        shellConfig,
        "utf8"
      );
  }

  let changed = false;

  for (
    const configuredPath of paths
  ) {
    const expandedPath =
      expandHome(configuredPath);

    const pathLine =
      `export PATH="${expandedPath}:$PATH"`;

    if (
      content.includes(
        pathLine
      )
    ) {
      continue;
    }

    if (
      !content.endsWith("\n")
    ) {
      content += "\n";
    }

    content +=
      `# Naeso PATH\n${pathLine}\n`;

    changed = true;
  }

  if (
    changed
  ) {
    fs.writeFileSync(
      shellConfig,
      content,
      "utf8"
    );
  }

  return {
    shellConfig,
    changed
  };
}


function removePath(paths) {
  if (
    !Array.isArray(paths)
  ) {
    return {
      shellConfig:
        getShellConfigFile(),
      changed: false
    };
  }

  const shellConfig =
    getShellConfigFile();

  if (
    !fs.existsSync(
      shellConfig
    )
  ) {
    return {
      shellConfig,
      changed: false
    };
  }

  let content =
    fs.readFileSync(
      shellConfig,
      "utf8"
    );

  let changed = false;

  for (
    const configuredPath of paths
  ) {
    const expandedPath =
      expandHome(configuredPath);

    const pathLine =
      `export PATH="${expandedPath}:$PATH"`;

    const block =
      `# Naeso PATH\n${pathLine}\n`;

    if (
      content.includes(
        block
      )
    ) {
      content =
        content.replace(
          block,
          ""
        );

      changed = true;
      continue;
    }

    if (
      content.includes(
        pathLine
      )
    ) {
      content =
        content.replace(
          `${pathLine}\n`,
          ""
        );

      content =
        content.replace(
          pathLine,
          ""
        );

      changed = true;
    }
  }

  if (
    changed
  ) {
    fs.writeFileSync(
      shellConfig,
      content,
      "utf8"
    );
  }

  return {
    shellConfig,
    changed
  };
}


module.exports = {
  configurePath,
  removePath,
  getShellConfigFile,
  expandHome
};