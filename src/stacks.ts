export const stacks = [
  {
    id: "nodejs",
    label: "Node.js",
    hint: "A Node.js HTTP service with no framework, tests, and a Dockerfile",
    developmentScript: "start:dev",
    requiresDatabase: false,
  },
  {
    id: "nestjs",
    label: "NestJS",
    hint: "A NestJS HTTP API with tests and a Dockerfile",
    developmentScript: "start:dev",
    requiresDatabase: false,
  },
  {
    id: "nextjs",
    label: "Next.js",
    hint: "A Next.js web app with React, Tailwind CSS, and end-to-end tests",
    developmentScript: "dev",
    requiresDatabase: false,
  },
  {
    id: "payload",
    label: "Payload",
    hint: "A Payload CMS on Next.js that needs a PostgreSQL database",
    developmentScript: "dev",
    requiresDatabase: true,
  },
  {
    id: "turborepo",
    label: "Turborepo",
    hint: "A Turborepo with a Next.js app and a Payload backoffice that needs PostgreSQL",
    developmentScript: "dev",
    requiresDatabase: true,
  },
] as const;

export type StackId = (typeof stacks)[number]["id"];
export const defaultStackId: StackId = "nextjs";

export const stackById = Object.fromEntries(stacks.map(stack => [stack.id, stack])) as Record<
  StackId,
  (typeof stacks)[number]
>;

/**
 * Check whether a string names a supported stack.
 * @param value - Stack name from the command line.
 * @returns Whether `value` is a supported stack id.
 */
export function isStackId(value: string): value is StackId {
  return stacks.some(stack => stack.id === value);
}

/**
 * Name the package a stack's template declares, which the CLI replaces with the project name.
 * @param stack - Supported stack id.
 * @returns Package name in the template's `package.json`.
 */
export function templateName(stack: StackId): string {
  return `next-friday-template-${stack}`;
}
