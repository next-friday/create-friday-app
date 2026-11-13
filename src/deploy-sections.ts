import type {DeployTarget} from "./deploy-targets.ts";

const marker = /^\s*(?:#|\/\/|<!--)\s*deploy:(?<name>[a-z]+)\s*(?:-->\s*)?$/u;
const endName = "end";

/**
 * Keep the sections of a template file marked for the chosen deploy target and remove the others.
 * A section starts at a comment line that holds `deploy:<target>` and ends at one that holds `deploy:end`.
 * Every marker line is removed, with a blank line that directly follows it.
 * @param content - Text of a copied template file.
 * @param target - Chosen deploy target.
 * @returns The text for the chosen deploy target.
 */
export function resolveDeploySections(content: string, target: DeployTarget): string {
  const kept: string[] = [];
  let section: string | undefined;
  let isAfterMarker = false;
  const lines = content.split("\n");

  for (const [index, line] of lines.entries()) {
    const name = marker.exec(line)?.groups?.name;

    if (name === undefined) {
      const isBlankAfterMarker = isAfterMarker && line.trim() === "" && index < lines.length - 1;

      if (!isBlankAfterMarker && (section ?? target) === target) {
        kept.push(line);
      }
    } else {
      section = sectionAfterMarker(name, section);
    }

    isAfterMarker = name !== undefined;
  }

  if (section !== undefined) {
    throw new Error(`The deploy:${section} section has no deploy:end marker.`);
  }

  return kept.join("\n");
}

/**
 * Give the section a marker line leaves open, or throw when the marker is out of place.
 * @param name - Deploy target the marker names, or `end`.
 * @param section - Deploy target of the section the marker sits in, or `undefined` outside a section.
 * @returns The deploy target of the section now open, or `undefined` after an end marker.
 */
function sectionAfterMarker(name: string, section: string | undefined): string | undefined {
  if (name === endName) {
    if (section === undefined) {
      throw new Error("A deploy:end marker has no deploy target section to close.");
    }

    return undefined;
  }

  if (section !== undefined) {
    throw new Error(`A deploy:${name} marker starts inside the deploy:${section} section.`);
  }

  return name;
}
