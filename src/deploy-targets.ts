export const deployTargets = ["none", "railway"] as const;
export type DeployTarget = (typeof deployTargets)[number];

/**
 * Check whether a string names a supported deploy target.
 * @param value - Deploy target from the command line.
 * @returns Whether `value` is a supported deploy target.
 */
export function isDeployTarget(value: string): value is DeployTarget {
  return deployTargets.some(target => target === value);
}
