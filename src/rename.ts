import path from "node:path";
import {readdir, readFile, writeFile} from "node:fs/promises";

/**
 * Replace the template name with the project name in every text file.
 * @param directory - Project directory.
 * @param from - Template name to replace.
 * @param to - Project name.
 * @returns Paths of the files that changed.
 */
export async function renameProject(
  directory: string,
  from: string,
  to: string,
): Promise<string[]> {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });

  const files = entries
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name));

  const changed = await Promise.all(
    files.map(async file => {
      const content = await readFile(file);
      const text = content.toString("utf8");

      if (
        content.includes(0) ||
        !content.includes(from) ||
        !Buffer.from(text, "utf8").equals(content)
      ) {
        return [];
      }

      await writeFile(
        file,
        text.replaceAll(from, () => to),
      );

      return [file];
    }),
  );

  return changed.flat();
}
