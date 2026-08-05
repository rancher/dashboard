import { base64Encode } from '@shell/utils/crypto';
import { CATALOG as CATALOG_TYPES, SECRET } from '@shell/config/types';
import { CATALOG, DESCRIPTION, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';
import { getVersionData, CURRENT_RANCHER_VERSION } from '@shell/config/version';

export const SUSE_APP_COLLECTION_REPO_URL = 'oci://dp.apps.rancher.io/charts';
export const FLEET_APPCO_AUTH_GENERATE_NAME = 'fleet-appco-auth-';
export const IMAGE_PULL_SECRET_SUFFIX = '-image-pull-secret';
export const SUSE_APPCO_DISPLAY_NAME = 'SUSE AppCo';

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
}

export const FLEET_DOCS = {
  downstreamResources: {
    path: 'how-tos-for-users/downstream-resource-propagation', minRancherMinor: 15, minRancherPatch: 0
  },
  bundleDeploymentOptions: {
    path: 'reference/ref-crds', anchor: '_bundledeploymentoptions', minRancherMinor: 15, minRancherPatch: 0
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

/**
 * Build a Fleet docs URL for `doc`, choosing between the community and Rancher Prime docs and
 * between the current and "next" (unreleased) channel (see fleetDocsChannel):
 *
 * - Community (fleet.rancher.io): current release at the root, unreleased under `/next/`.
 * - Prime (documentation.suse.com): current release at `/latest/`, unreleased at `/next/`.
 */
function fleetDocsUrl(doc: FleetDoc, isPrime: boolean): string {
  const hash = doc.anchor ? `#${ doc.anchor }` : '';
  const channel = fleetDocsChannel(doc);

  if (isPrime) {
    const segment = channel === 'next' ? 'next' : 'latest';

    return `${ FLEET_PRIME_DOCS_BASE }/${ segment }/en/${ doc.path }.html${ hash }`;
  }

  const communityPath = channel === 'next' ? `next/${ doc.path }` : doc.path;

  return `${ FLEET_COMMUNITY_DOCS_BASE }/${ communityPath }${ hash }`;
}

/**
 * Whether this is a Rancher Prime install. Read from the same server version data as the docs
 * channel (`getVersionData`) instead of importing `isRancherPrime` from `@shell/config/version`,
 * whose exports vue-tsc cannot currently resolve from that JS module.
 */
function isPrimeInstall(): boolean {
  return getVersionData().RancherPrime?.toLowerCase() === 'true';
}

export function getDownstreamResourcesDocsUrl(): string {
  return fleetDocsUrl(FLEET_DOCS.downstreamResources, isPrimeInstall());
}

export function getBundleDeploymentOptionsDocsUrl(): string {
  return fleetDocsUrl(FLEET_DOCS.bundleDeploymentOptions, isPrimeInstall());
}

interface AuthCredentials {
  publicKey: string;
  privateKey: string;
}

export interface RepoState {
  repoName: string;
  stateDisplay: string;
  stateBackground: string;
  transitioning: boolean;
  error: boolean;
  errorMessage: string;
}

interface WaitResult {
  repo: any;
  state: RepoState | null;
  // True only when the repo definitively does not exist (404), as opposed to the
  // lookup failing for another reason (network/API error). Distinguishes "repo
  // absent, safe to create" from "couldn't reach the repo".
  notFound?: boolean;
}

interface VuexStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: string, payload?: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getters: Record<string, any>;
}

export async function createAppCoAuthSecret(store: VuexStore, credentials: AuthCredentials, namespace: string) {
  const { publicKey, privateKey } = credentials;

  const secret = await store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
    type:     SECRET,
    metadata: {
      namespace,
      generateName: FLEET_APPCO_AUTH_GENERATE_NAME,
      labels:       { [FLEET_LABELS.MANAGED]: 'true' }
    }
  });

  secret._type = SECRET_TYPES.BASIC;
  secret.data = {
    username: base64Encode(publicKey),
    password: base64Encode(privateKey),
  };

  await secret.save();

  return secret;
}

export async function ensureAppCoImagePullSecret(store: VuexStore, authSecretName: string, namespace: string): Promise<string | undefined> {
  const imagePullSecretName = `${ authSecretName }${ IMAGE_PULL_SECRET_SUFFIX }`;

  let imagePullSecret = store.getters[`${ CATALOG._MANAGEMENT }/byId`](SECRET, `${ namespace }/${ imagePullSecretName }`);

  if (!imagePullSecret) {
    try {
      imagePullSecret = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: SECRET, id: `${ namespace }/${ imagePullSecretName }` });
    } catch (e) {
      let authSecret;

      try {
        authSecret = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: SECRET, id: `${ namespace }/${ authSecretName }` });
      } catch (_) {
        console.warn(`AppCo: auth secret "${ authSecretName }" not found in namespace "${ namespace }", skipping image-pull-secret creation`); // eslint-disable-line no-console

        return;
      }

      const registryHost = new URL(SUSE_APP_COLLECTION_REPO_URL.replace('oci://', 'https://')).host;
      const username = authSecret.decodedData?.username || '';
      const password = authSecret.decodedData?.password || '';
      const config = { auths: { [registryHost]: { username, password } } };

      const newSecret = await store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
        type:     SECRET,
        _type:    SECRET_TYPES.DOCKER_JSON,
        metadata: {
          name:   imagePullSecretName,
          namespace,
          labels: { [FLEET_LABELS.MANAGED]: 'true' }
        }
      });

      newSecret.setData('.dockerconfigjson', JSON.stringify(config));
      await newSecret.save();
    }
  }

  return imagePullSecretName;
}

export async function ensureAppCoClusterRepo(store: VuexStore, authSecretName: string, namespace: string, t: (key: string) => string): Promise<string> {
  const repoName = deriveRepoName(authSecretName);
  let repo = store.getters[`${ CATALOG._MANAGEMENT }/byId`](CATALOG_TYPES.CLUSTER_REPO, repoName);

  if (!repo) {
    try {
      repo = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: CATALOG_TYPES.CLUSTER_REPO, id: repoName });
    } catch (e) {
      try {
        repo = await store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
          type:     CATALOG_TYPES.CLUSTER_REPO,
          metadata: {
            name:        repoName,
            annotations: {
              [DESCRIPTION]:                 t('catalog.repo.target.suseAppCollection.description'),
              [CATALOG.SUSE_APP_COLLECTION]: 'true',
            },
          },
          spec: {
            url:          SUSE_APP_COLLECTION_REPO_URL,
            clientSecret: {
              namespace,
              name: authSecretName,
            },
          },
        });

        await repo.save();
      } catch (err: any) {
        if (err.status === 409) {
          return repoName;
        }

        throw err;
      }
    }
  }

  return repoName;
}

/**
 * Verify the auth secret exists, then ensure its image-pull secret and ClusterRepo
 * exist. Returns false (and creates nothing) if the secret cannot be found.
 */
export async function ensureAppCoResources(
  store: VuexStore,
  authSecretName: string,
  namespace: string,
  t: (key: string) => string
): Promise<boolean> {
  const secretId = `${ namespace }/${ authSecretName }`;
  let authSecret = store.getters[`${ CATALOG._MANAGEMENT }/byId`](SECRET, secretId);

  if (!authSecret) {
    try {
      authSecret = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, { type: SECRET, id: secretId });
    } catch (e) {
      return false;
    }
  }

  await Promise.all([
    ensureAppCoImagePullSecret(store, authSecretName, namespace),
    ensureAppCoClusterRepo(store, authSecretName, namespace, t),
  ]);

  return true;
}

// Cold/first OCI pulls of the AppCo catalog can take several minutes to download,
// so we allow a generous window before giving up. Genuine repo/OCI errors still
// short-circuit early via the `hasError` path below, so this only bounds how long
// we tolerate a repo that is still downloading. Added as 10 minutes to consider
// future increases on the size of the AppCo catalog.
const REPO_WAIT_TIMEOUT_MS = 600000; // 10 minutes
const REPO_WAIT_INTERVAL_MS = 3000;

function getRepoState(repo: any, repoName: string): { state: RepoState; isReady: boolean; hasError: boolean } {
  const state = repo.metadata?.state;
  const conditions = repo.status?.conditions || [];
  const ociCondition = conditions.find((c: any) => c.type === 'OCIDownloaded');
  const isReady = ociCondition?.status === 'True';
  const hasError = !!(state?.error || ociCondition?.error);

  const repoState: RepoState = {
    repoName,
    stateDisplay:    repo.stateDisplay,
    stateBackground: repo.stateBackground,
    transitioning:   !isReady && !hasError,
    error:           hasError,
    errorMessage:    state?.message || ociCondition?.message || '',
  };

  return {
    state: repoState, isReady, hasError
  };
}

async function waitForRepoReady(
  store: VuexStore,
  repoName: string,
  { onStateChange, signal }: { onStateChange?: (state: RepoState) => void; signal?: AbortSignal } = {}
): Promise<WaitResult> {
  let repo;

  // `find` with `force: true` re-fetches and registers a watch, so the store's
  // cached resource is kept up to date via subscription while we wait below.
  try {
    repo = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, {
      type: CATALOG_TYPES.CLUSTER_REPO,
      id:   repoName,
      opt:  { force: true },
    });
  } catch (e: any) {
    // A 404 means the repo simply doesn't exist yet; any other error means the
    // lookup itself failed (network/API), which callers must not treat as "absent".
    return {
      repo: null, state: null, notFound: e?.status === 404
    };
  }

  let result: WaitResult = { repo: null, state: null };

  try {
    await repo.waitForTestFn(() => {
      if (signal?.aborted) {
        return true;
      }

      // Read the latest resource from the store, kept fresh by the watch above.
      const current = store.getters[`${ CATALOG._MANAGEMENT }/byId`](CATALOG_TYPES.CLUSTER_REPO, repoName);

      if (!current) {
        return true;
      }

      const { state, isReady, hasError } = getRepoState(current, repoName);

      onStateChange?.(state);

      if (hasError) {
        result = { repo: null, state };

        return true;
      }

      if (isReady) {
        result = { repo: current, state };

        return true;
      }

      return false;
    }, `appco repo ${ repoName } ready`, REPO_WAIT_TIMEOUT_MS, REPO_WAIT_INTERVAL_MS);
  } catch (e) {
    // Timed out waiting for the repo to become ready
    return result;
  }

  if (signal?.aborted) {
    return { repo: null, state: null };
  }

  return result;
}

interface FetchChartsResult {
  entries: Record<string, any[]> | null;
  repoState: RepoState | null;
  // True only when the repo does not exist (404); see WaitResult.notFound.
  notFound?: boolean;
}

export async function fetchAppCoCharts(
  store: VuexStore,
  repoName: string,
  onStateChange?: (state: RepoState) => void,
  // Used to stop on unmount or when repoName changes
  signal?: AbortSignal
): Promise<FetchChartsResult> {
  const { repo, state: repoState, notFound } = await waitForRepoReady(store, repoName, { onStateChange, signal });

  if (!repo) {
    return {
      entries: null, repoState, notFound
    };
  }

  const index = await repo.followLink('index');
  const entries = index?.entries || {};

  return { entries, repoState };
}

export function deriveRepoName(secretName: string): string {
  return secretName ? secretName.replace('auth', 'repo') : '';
}
