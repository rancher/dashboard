import { compatibleVersionsFor } from '@shell/store/catalog';

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
