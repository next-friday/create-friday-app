export const stacks = [
  {
    id: "nodejs",
    label: "Node.js",
    hint: "HTTP service without a framework",
  },
  {
    id: "nestjs",
    label: "NestJS",
    hint: "HTTP API",
  },
  {
    id: "nextjs",
    label: "Next.js",
    hint: "Web app",
  },
  {
    id: "payload",
    label: "Payload",
    hint: "Headless CMS on Next.js and PostgreSQL",
  },
] as const;

export type StackId = (typeof stacks)[number]["id"];

export const developmentScripts: Record<StackId, string> = {
  nodejs: "start:dev",
  nestjs: "start:dev",
  nextjs: "dev",
  payload: "dev",
};

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
