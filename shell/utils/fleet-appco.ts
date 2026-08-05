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

const FLEET_DOWNSTREAM_RESOURCES_DOC_PATH = 'how-tos-for-users/downstream-resource-propagation';
const FLEET_BUNDLE_DEPLOYMENT_OPTIONS_DOC_PATH = 'reference/ref-crds';
const FLEET_BUNDLE_DEPLOYMENT_OPTIONS_ANCHOR = '_bundledeploymentoptions';

// Rancher version that first shipped the AppCo Fleet docs pages below. A page lands in the
// "next" (unreleased) docs and only moves to the current docs once the *following* release
// ships, so while this exact version is running the pages exist only under "next".
const FLEET_APPCO_DOCS_ADDED_IN = '2.15.0';

interface ParsedVersion { major: number; minor: number; patch: number }

/** Extract an X.Y.Z version from a string like "v2.15.0" or "v2.16.0-rc1"; null if none. */
function parseVersion(version: string): ParsedVersion | null {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(version || '');

  return match ? {
    major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3])
  } : null;
}

/**
 * Pick the docs channel for a page introduced in `addedIn`. A page lands in the unreleased
 * ("next") site and only moves to the current docs from the *following* release onward:
 *
 * - running version === the release that introduced the page -> "next" (not published yet)
 * - any later release                                        -> "current"
 *
 * The running version comes from the server (`getVersionData().Version`). Dev/head builds
 * don't report a clean X.Y.Z, so they fall back to the `.0` of the line this UI was built
 * for (`CURRENT_RANCHER_VERSION`), whose docs are likewise still in "next".
 */
function fleetDocsChannel(addedIn: string): 'next' | 'current' {
  const added = parseVersion(addedIn);
  const running = parseVersion(getVersionData().Version) ?? parseVersion(`${ CURRENT_RANCHER_VERSION }.0`);

  if (!added || !running) {
    return 'current';
  }

  const sameRelease = running.major === added.major && running.minor === added.minor && running.patch === added.patch;

  return sameRelease ? 'next' : 'current';
}

/**
 * Build a Fleet docs URL, choosing between the community and Rancher Prime docs and between
 * the current and "next" (unreleased) channel for a page introduced in `addedIn` (see
 * fleetDocsChannel):
 *
 * - Community (fleet.rancher.io): current release at the root, unreleased under `/next/`.
 * - Prime (documentation.suse.com): current release at `/latest/`, unreleased at `/next/`.
 */
function fleetDocsUrl(path: string, addedIn: string, { isPrime, anchor = '' }: { isPrime?: boolean; anchor?: string }): string {
  const hash = anchor ? `#${ anchor }` : '';
  const channel = fleetDocsChannel(addedIn);

  if (isPrime) {
    const segment = channel === 'next' ? 'next' : 'latest';

    return `${ FLEET_PRIME_DOCS_BASE }/${ segment }/en/${ path }.html${ hash }`;
  }

  const communityPath = channel === 'next' ? `next/${ path }` : path;

  return `${ FLEET_COMMUNITY_DOCS_BASE }/${ communityPath }${ hash }`;
}

export function getDownstreamResourcesDocsUrl(isPrime = false): string {
  return fleetDocsUrl(FLEET_DOWNSTREAM_RESOURCES_DOC_PATH, FLEET_APPCO_DOCS_ADDED_IN, { isPrime });
}

export function getBundleDeploymentOptionsDocsUrl(isPrime = false): string {
  return fleetDocsUrl(FLEET_BUNDLE_DEPLOYMENT_OPTIONS_DOC_PATH, FLEET_APPCO_DOCS_ADDED_IN, { isPrime, anchor: FLEET_BUNDLE_DEPLOYMENT_OPTIONS_ANCHOR });
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
