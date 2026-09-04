/**
 * Helpers for building version- and edition-aware links into the Fleet documentation.
 * Shared across the Fleet UI (AppCo, GitRepoRestriction, Policies, workspaces, ...), so kept
 * separate from any single feature's utils.
 *
 * Docs live in two places depending on the edition:
 * - Community: https://fleet.rancher.io (current release at the root, unreleased under /next/)
 * - Rancher Prime: https://documentation.suse.com/cloudnative/continuous-delivery
 *   (current release at /latest/, unreleased at /next/)
 *
 * Only pages flagged `usePrimeDoc` have a Rancher Prime counterpart; every other page is
 * community-only, even on a Prime install.
 */
import { getVersionData, CURRENT_RANCHER_VERSION } from '@shell/config/version';

const FLEET_COMMUNITY_DOCS_BASE = 'https://fleet.rancher.io';
const FLEET_PRIME_DOCS_BASE = 'https://documentation.suse.com/cloudnative/continuous-delivery';

interface FleetDoc {
  /** Path under the docs base, without a leading slash, file extension, or anchor. */
  path: string;
  /** Optional in-page anchor, without the leading '#'. */
  anchor?: string;
  /** Rancher minor that introduced the page (paired with minRancherPatch). */
  minRancherMinor: number;
  /**
   * Rancher patch that introduced the page. The page's docs live only in the "next"
   * (unreleased) site while exactly this minor.patch is running, and are published to the
   * current docs from the following release (any later patch or minor) onward.
   */
  minRancherPatch: number;
  /**
   * Whether this page has a Rancher Prime (documentation.suse.com) counterpart. When false,
   * the page is community-only (fleet.rancher.io), even on a Prime install.
   */
  usePrimeDoc: boolean;
}

export const FLEET_DOCS = {
  // AppCo docs — also published to the Rancher Prime docs.
  downstreamResources: {
    path: 'how-tos-for-users/downstream-resource-propagation', minRancherMinor: 15, minRancherPatch: 0, usePrimeDoc: true
  },
  bundleDeploymentOptions: {
    path: 'reference/ref-crds', anchor: '_bundledeploymentoptions', minRancherMinor: 15, minRancherPatch: 0, usePrimeDoc: true
  },
  // GitRepoRestriction migration docs — community-only.
  gitRepoRestrictionMigration: {
    path: 'how-tos-for-operators/tenant-setup', anchor: '_migration_from_gitreporestriction', minRancherMinor: 15, minRancherPatch: 0, usePrimeDoc: false
  },
} as const satisfies Record<string, FleetDoc>;

interface RancherVersion { minor: number; patch: number }

/**
 * Extract the Rancher minor and patch from a version string like "v2.15.1", "v2.16.0-rc1",
 * or "2.15" (patch defaults to 0); null if no X.Y is present.
 */
function parseRancherVersion(version: string): RancherVersion | null {
  const match = /\d+\.(\d+)(?:\.(\d+))?/.exec(version || '');

  return match ? { minor: Number(match[1]), patch: Number(match[2] ?? 0) } : null;
}

/**
 * Pick the docs channel for `doc`. Its docs live only in the "next" (unreleased) site while
 * exactly the release that introduced the page is running, and are published to the current
 * docs from the following release (any later patch or minor) onward:
 *
 * - running release === the release that introduced the page -> "next" (not published yet)
 * - a later release                                          -> "current"
 *
 * The running version comes from the server (`getVersionData().Version`). Dev/head builds
 * don't report a clean version, so they fall back to the minor this UI was built for
 * (`CURRENT_RANCHER_VERSION`, patch 0), whose docs are likewise still in "next".
 */
function fleetDocsChannel(doc: FleetDoc): 'next' | 'current' {
  const running = parseRancherVersion(getVersionData().Version) ?? parseRancherVersion(CURRENT_RANCHER_VERSION);

  if (!running) {
    return 'current';
  }

  if (running.minor !== doc.minRancherMinor) {
    return running.minor > doc.minRancherMinor ? 'current' : 'next';
  }

  return running.patch > doc.minRancherPatch ? 'current' : 'next';
}

/** Whether this is a Rancher Prime install (read from the server version data). */
function isPrimeInstall(): boolean {
  return getVersionData().RancherPrime?.toLowerCase() === 'true';
}

/**
 * Build a Fleet docs URL for `doc`, choosing between community and Rancher Prime docs (only
 * when the page has a Prime counterpart and we're on a Prime install) and between the current
 * and "next" (unreleased) channel (see fleetDocsChannel):
 *
 * - Community (fleet.rancher.io): current release at the root, unreleased under `/next/`.
 * - Prime (documentation.suse.com): current release at `/latest/`, unreleased at `/next/`.
 */
function fleetDocsUrl(doc: FleetDoc): string {
  const hash = doc.anchor ? `#${ doc.anchor }` : '';
  const channel = fleetDocsChannel(doc);
  const isPrime = doc.usePrimeDoc && isPrimeInstall();

  if (isPrime) {
    const segment = channel === 'next' ? 'next' : 'latest';

    return `${ FLEET_PRIME_DOCS_BASE }/${ segment }/en/${ doc.path }.html${ hash }`;
  }

  const communityPath = channel === 'next' ? `next/${ doc.path }` : doc.path;

  return `${ FLEET_COMMUNITY_DOCS_BASE }/${ communityPath }${ hash }`;
}

/** Fleet "downstream resources" docs (AppCo; has a Rancher Prime counterpart). */
export function getDownstreamResourcesDocsUrl(): string {
  return fleetDocsUrl(FLEET_DOCS.downstreamResources);
}

/** Fleet "BundleDeploymentOptions" (CRD reference) docs (AppCo; has a Rancher Prime counterpart). */
export function getBundleDeploymentOptionsDocsUrl(): string {
  return fleetDocsUrl(FLEET_DOCS.bundleDeploymentOptions);
}

/** Fleet GitRepoRestriction -> Policies migration docs (community-only). */
export function getGitRepoRestrictionMigrationDocsUrl(): string {
  return fleetDocsUrl(FLEET_DOCS.gitRepoRestrictionMigration);
}
