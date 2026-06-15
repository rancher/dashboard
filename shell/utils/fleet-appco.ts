import { base64Encode } from '@shell/utils/crypto';
import { CATALOG as CATALOG_TYPES, SECRET } from '@shell/config/types';
import { CATALOG, DESCRIPTION, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';

export const SUSE_APP_COLLECTION_REPO_URL = 'oci://dp.apps.rancher.io/charts';
export const FLEET_APPCO_AUTH_GENERATE_NAME = 'fleet-appco-auth-';
export const IMAGE_PULL_SECRET_SUFFIX = '-image-pull-secret';
export const SUSE_APPCO_DISPLAY_NAME = 'SUSE AppCo';

// Used when the Rancher version can't be parsed (e.g. dev builds), so we point
// at the latest, unversioned Fleet docs.
export const FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL = 'https://fleet.rancher.io/next/downstream-resources';

/**
 * Build the URL to the Fleet "downstream resources" docs for the running Rancher version.
 *
 * Rancher `2.X.0` (for X >= 15) ships with Fleet `0.(X+1)`, whose docs are published at
 * `https://fleet.rancher.io/0.<minor + 1>/downstream-resources`. For anything older or
 * unparseable we fall back to the unversioned `next` docs.
 */
export function getDownstreamResourcesDocsUrl(rancherVersion?: string): string {
  // Harcoded to 2.X.0, it is fragile because if the version changes it will break.
  // Ideally it would require a correlation between versions, but we have the fallback in place.
  const match = /^v?2\.(\d+)/.exec(rancherVersion || '');
  const minor = match ? parseInt(match[1], 10) : NaN;

  // It should only exists after version 0.15.0, which will be fleet 0.16.0.
  if (!isNaN(minor) && minor >= 15) {
    return `https://fleet.rancher.io/0.${ minor + 1 }/downstream-resources`;
  }

  return FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL;
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

const REPO_WAIT_TIMEOUT_MS = 90000;
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
