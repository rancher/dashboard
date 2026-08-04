/**
 * Helpers for building version-aware links into the Fleet documentation
 * (https://fleet.rancher.io). Shared across Fleet UI (App Bundles, GitRepoRestriction,
 * workspaces, ...), so kept separate from any single feature's utils.
 */

export const FLEET_DOCS_BASE_URL = 'https://fleet.rancher.io';

interface FleetDoc {
  /** Path under the Fleet docs version root, e.g. `downstream-resources` (may include a `#anchor`). */
  path: string;
  /**
   * Minimum Rancher minor (`2.<minor>`) at which this page exists in the *released* Fleet docs.
   * Below it (or for unparseable versions) we link to the unversioned `next` docs instead.
   * Each page was introduced in a different Fleet release, so this is per-document.
   */
  minRancherMinor: number;
}

/**
 * Per-document Fleet docs mapping. Rancher `2.X.0` ships with Fleet `0.(X+1)`, so at or
 * above a page's `minRancherMinor` we deep-link to `0.<X+1>/<path>`.
 *
 * All three currently ship in Rancher 2.15 / Fleet 0.16, but keep them separate: the
 * pages were added at different times, so their minimums may diverge in future releases.
 */
export const FLEET_DOCS = {
  downstreamResources:         { path: 'downstream-resources', minRancherMinor: 15 },
  policies:                    { path: 'reference/ref-policy', minRancherMinor: 15 },
  gitRepoRestrictionMigration: { path: 'how-tos-for-operators/tenant-setup#_migration_from_gitreporestriction', minRancherMinor: 15 },
} as const satisfies Record<string, FleetDoc>;

/**
 * Build a versioned Fleet docs URL for the running Rancher version, honouring the
 * document's own minimum version. Harcoded to `2.X` -> `0.(X+1)`; fragile if that
 * correlation changes, but the `next` fallback keeps links working meanwhile.
 */
function fleetDocsUrl({ path, minRancherMinor }: FleetDoc, rancherVersion?: string): string {
  const match = /^v?2\.(\d+)/.exec(rancherVersion || '');
  const minor = match ? parseInt(match[1], 10) : NaN;
  const segment = !isNaN(minor) && minor >= minRancherMinor ? `0.${ minor + 1 }` : 'next';

  return `${ FLEET_DOCS_BASE_URL }/${ segment }/${ path }`;
}

// Used when the Rancher version can't be parsed (e.g. dev builds), so we point
// at the latest, unversioned Fleet docs.
export const FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL = `${ FLEET_DOCS_BASE_URL }/next/${ FLEET_DOCS.downstreamResources.path }`;
export const FLEET_CD_POLICIES_DOCS_FALLBACK_URL = `${ FLEET_DOCS_BASE_URL }/next/${ FLEET_DOCS.policies.path }`;
export const FLEET_GITREPORESTRICTION_MIGRATION_DOCS_FALLBACK_URL = `${ FLEET_DOCS_BASE_URL }/next/${ FLEET_DOCS.gitRepoRestrictionMigration.path }`;

/**
 * Build the URL to the Fleet "downstream resources" docs for the running Rancher version.
 */
export function getDownstreamResourcesDocsUrl(rancherVersion?: string): string {
  return fleetDocsUrl(FLEET_DOCS.downstreamResources, rancherVersion);
}

/**
 * Build the URL to the Fleet "Policy" reference docs (branded "SUSE Continuous Delivery
 * Policies", the successor to the deprecated GitRepoRestriction) for the running Rancher
 * version.
 */
export function getContinuousDeliveryPoliciesDocsUrl(rancherVersion?: string): string {
  return fleetDocsUrl(FLEET_DOCS.policies, rancherVersion);
}

/**
 * Build the URL to the Fleet docs section covering migration from the deprecated
 * GitRepoRestriction to Policies, for the running Rancher version.
 */
export function getGitRepoRestrictionMigrationDocsUrl(rancherVersion?: string): string {
  return fleetDocsUrl(FLEET_DOCS.gitRepoRestrictionMigration, rancherVersion);
}
