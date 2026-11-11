import path from "node:path";
import {readdir} from "node:fs/promises";

/**
 * List the files of a project directory, leaving out a Git repository the directory already held.
 * @param directory - Project directory.
 * @returns Absolute paths of the files.
 */
export async function listProjectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name))
    .filter(file => path.relative(directory, file).split(path.sep)[0] !== ".git");
}
