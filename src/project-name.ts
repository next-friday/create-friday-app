import {lstatSync, readdirSync} from "node:fs";
import path from "node:path";

const packageNamePattern = /^[a-z0-9][a-z0-9._-]*$/;
const maxPackageNameLength = 214;
const reservedNames = new Set(["favicon.ico", "node_modules"]);
const windowsReservedPattern = /^(?:con|prn|aux|nul|com\d|lpt\d)(?:\.|$)|\.$/;

/**
 * Name the package after the project directory, so `.` uses the current directory's name.
 * @param name - Project name from the command line or prompt.
 * @param cwd - Directory the project is created in.
 * @returns Package name for `package.json`.
 */
export function packageName(name: string, cwd: string): string {
  return name === "." ? path.basename(cwd) : name;
}

/**
 * Validate a project name as an npm package name and a free target directory.
 * @param name - Project name, used as the directory and package name, or `.` for the current directory.
 * @param cwd - Directory the project is created in.
 * @returns An error message, or `undefined` when the name is usable.
 */
export function validateProjectName(name: string, cwd: string): string | undefined {
  const manifestName = packageName(name, cwd);

  if (!packageNamePattern.test(manifestName) || manifestName.length > maxPackageNameLength) {
    const subject =
      name === "."
        ? `The current directory name "${manifestName}" is not a valid package name. `
        : "";

    return `${subject}Use lowercase letters, digits, '.', '_' or '-', starting with a letter or digit.`;
  }

  if (reservedNames.has(manifestName)) {
    return `"${manifestName}" is reserved by npm. Choose another name.`;
  }

  if (windowsReservedPattern.test(manifestName)) {
    return `Windows does not allow "${manifestName}" as a directory name. Choose another name.`;
  }

  const target = path.resolve(cwd, name);

  const stats = lstatSync(target, {
    throwIfNoEntry: false,
  });

  if (stats === undefined) {
    return undefined;
  }

  if (!stats.isDirectory()) {
    return `${target} already exists and is not a directory.`;
  }

  return ownEntries(target).length > 0 ? `${target} already exists and is not empty.` : undefined;
}

/**
 * List the entries a project directory may already hold. A fresh clone of an empty repository holds `.git`.
 * @param directory - Project directory.
 * @returns Entries other than `.git`.
 */
function ownEntries(directory: string): string[] {
  return readdirSync(directory).filter(entry => entry !== ".git");
}
