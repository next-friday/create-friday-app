import {readFile, writeFile} from "node:fs/promises";

import {listProjectFiles} from "./project-files.ts";

/**
 * Replace the template name with the project name in every text file.
 * @param directory - Project directory.
 * @param from - Template name to replace.
 * @param to - Project name.
 */
export async function renameProject(directory: string, from: string, to: string): Promise<void> {
  const files = await listProjectFiles(directory);

  await Promise.all(
    files.map(async file => {
      const content = await readFile(file);
      const text = content.toString("utf8");

      if (
        content.includes(0) ||
        !content.includes(from) ||
        !Buffer.from(text, "utf8").equals(content)
      ) {
        return;
      }

      await writeFile(
        file,
        text.replaceAll(from, () => to),
      );
    }),
  );
}
