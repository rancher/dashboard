/**
 * Utility functions for versions formatting
 */

/**
 * Format version
 * @param version - Version string (e.g., "2.16.0", "v2.16.0", "2.16", "2.16.0-rc.1")
 * @param includePatch - If false, removes patch version (2.16.0 → 2.16). Default: false
 * @param addVPrefix - If true, adds 'v' prefix (2.16 → v2.16). Default: false
 * @returns Formatted version string
 */
export function formatVersion(
  version: string,
  includePatch = false,
  addVPrefix = true,
): string {
  if (!version) {
    return '';
  }

  // Remove 'v' prefix if present
  let cleanVersion = version.startsWith('v') ? version.slice(1) : version;

  if (!includePatch) {
    // Extract major.minor
    const match = cleanVersion.match(/^(\d+)\.(\d+)/);

    if (match) {
      cleanVersion = `${ match[1] }.${ match[2] }`;
    }
  }

  if (addVPrefix) {
    cleanVersion = `v${ cleanVersion }`;
  }

  return cleanVersion;
}

export const CURRENT_RANCHER_VERSION = formatVersion(Cypress.env('rancherVersion'));
