import semver from 'semver';
import { compare } from '@shell/utils/version';
import { compatibleVersionsFor } from '@shell/store/catalog';

/**
 * Compares two chart versions using SemVer logic, with special handling for Rancher's "up" build metadata.
 *
 * It uses `semver.compare` for the primary comparison. If versions are considered equal (SemVer ignores build metadata),
 * it checks if both versions have build metadata starting with "up". If so, it strips the "up" prefix and compares the remaining strings as versions.
 *
 * If the "up" logic doesn't apply or results in equality, it falls back to `semver.compareBuild` to handle
 * other build metadata differences (e.g. sorting alphabetically).
 *
 * @param {string} v1 - The first version string.
 * @param {string} v2 - The second version string.
 * @returns {number} - 0 if equal, -1 if v1 < v2, 1 if v1 > v2.
 */
export function compareChartVersions(v1, v2) {
  const v1Valid = semver.valid(v1, { loose: true });
  const v2Valid = semver.valid(v2, { loose: true });

  if (!v1Valid || !v2Valid) {
    return compare(v1, v2);
  }

  // semver.compare ignores build metadata (e.g., 1.0.0+1 == 1.0.0+2)
  let diff = semver.compare(v1, v2, { loose: true });

  if (diff === 0) {
    const parsedV1 = semver.parse(v1, { loose: true });
    const parsedV2 = semver.parse(v2, { loose: true });
    const buildV1 = parsedV1.build.join('.');
    const buildV2 = parsedV2.build.join('.');

    // Special logic for Rancher charts where "up" prefix in build metadata contains version info.
    // E.g. 108.0.0+up0.25.0-rc.4 vs 108.0.0+up0.25.0
    // Standard semver.compareBuild would sort ASCII: "up...-rc" > "up..." (incorrect for RC)
    // We strip "up" and compare the rest as versions to properly handle pre-releases (RC < Stable).
    if (buildV1.startsWith('up') && buildV2.startsWith('up')) {
      const subV1 = buildV1.substring(2);
      const subV2 = buildV2.substring(2);
      const subV1Valid = semver.valid(subV1, { loose: true });
      const subV2Valid = semver.valid(subV2, { loose: true });

      if (subV1Valid && subV2Valid) {
        // Both "up" metadata parts are valid semver: compare them semantically.
        diff = semver.compare(subV1, subV2, { loose: true });
      } else if (subV1Valid && !subV2Valid) {
        // Only v1 has valid "up" metadata: prefer v1 over v2.
        diff = 1;
      } else if (!subV1Valid && subV2Valid) {
        // Only v2 has valid "up" metadata: prefer v2 over v1.
        diff = -1;
      }
    }

    // Fallback to standard build comparison for other cases (e.g. 1.0.0+1 vs 1.0.0+2).
    // semver.compareBuild sorts build metadata lexicographically.
    if (diff === 0) {
      diff = semver.compareBuild(v1, v2, { loose: true });
    }
  }

  return diff;
}

/**
 * Get the latest chart version that is compatible with the cluster's OS and user's pre-release preference.
 * @param {Object} chart - The chart object.
 * @param {Array<string>} workerOSs - The list of worker OSs for the cluster.
 * @param {boolean} showPrerelease - Whether to include pre-release versions.
 * @returns {Object} The latest compatible chart version object.
 */
export function getLatestCompatibleVersion(chart, workerOSs, showPrerelease) {
  if (!chart?.versions?.length) {
    return {};
  }

  const compatible = compatibleVersionsFor(chart, workerOSs, showPrerelease);

  return (compatible.length ? compatible[0] : chart.versions[0]) || {};
}
