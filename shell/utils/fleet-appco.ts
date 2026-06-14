import { base64Encode } from '@shell/utils/crypto';
import {
  AUTH_TYPE, CATALOG as CATALOG_TYPES, FLEET_APPCO_AUTH_GENERATE_NAME, NORMAN, SECRET
} from '@shell/config/types';
import { CATALOG, DESCRIPTION, FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';

export const SUSE_APP_COLLECTION_REPO_URL = 'oci://dp.apps.rancher.io/charts';

interface AuthCredentials {
  selected: string;
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
}

interface VuexStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: string, payload?: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getters: Record<string, any>;
}

export async function createAppCoAuthSecret(store: VuexStore, credentials: AuthCredentials, namespace: string) {
  const {
    selected,
    publicKey,
    privateKey,
  } = credentials;

  if (![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3].includes(selected)) {
    return;
  }

  let secret;

  if (selected === AUTH_TYPE._S3) {
    secret = await store.dispatch('rancher/create', {
      type:               NORMAN.CLOUD_CREDENTIAL,
      s3credentialConfig: {
        accessKey: publicKey,
        secretKey: privateKey,
      },
    });
  } else {
    secret = await store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
      type:     SECRET,
      metadata: {
        namespace,
        generateName: FLEET_APPCO_AUTH_GENERATE_NAME,
        labels:       { [FLEET_LABELS.MANAGED]: 'true' }
      }
    });

    let type, publicField, privateField;

    switch (selected) {
    case AUTH_TYPE._SSH:
      type = SECRET_TYPES.SSH;
      publicField = 'ssh-publickey';
      privateField = 'ssh-privatekey';
      break;
    case AUTH_TYPE._BASIC:
      type = SECRET_TYPES.BASIC;
      publicField = 'username';
      privateField = 'password';
      break;
    default:
      throw new Error('Unknown type');
    }

    secret._type = type;
    secret.data = {
      [publicField]:  base64Encode(publicKey),
      [privateField]: base64Encode(privateKey),
    };
  }

  await secret.save();

  return secret;
}

export async function ensureAppCoImagePullSecret(store: VuexStore, authSecretName: string, namespace: string): Promise<string | undefined> {
  const imagePullSecretName = `${ authSecretName }-image-pull-secret`;

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

async function waitForRepoReady(
  store: VuexStore,
  repoName: string,
  {
    maxAttempts = 30, intervalMs = 3000, onStateChange, signal
  }: { maxAttempts?: number; intervalMs?: number; onStateChange?: (state: RepoState) => void; signal?: AbortSignal } = {}
): Promise<WaitResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      return { repo: null, state: null };
    }
    let repo;

    try {
      repo = await store.dispatch(`${ CATALOG._MANAGEMENT }/find`, {
        type: CATALOG_TYPES.CLUSTER_REPO,
        id:   repoName,
        opt:  { force: true },
      });
    } catch (e) {
      return { repo: null, state: null };
    }

    const state = repo.metadata?.state;
    const conditions = repo.status?.conditions || [];
    const ociCondition = conditions.find((c: any) => c.type === 'OCIDownloaded');
    const isReady = ociCondition?.status === 'True';
    const hasError = state?.error || ociCondition?.error;

    const repoState: RepoState = {
      repoName,
      stateDisplay:    repo.stateDisplay,
      stateBackground: repo.stateBackground,
      transitioning:   !isReady && !hasError,
      error:           !!hasError,
      errorMessage:    state?.message || ociCondition?.message || '',
    };

    onStateChange?.(repoState);

    if (hasError) {
      return { repo: null, state: repoState };
    }

    if (isReady) {
      return { repo, state: repoState };
    }

    if (signal?.aborted) {
      return { repo: null, state: null };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { repo: null, state: null };
}

interface FetchChartsResult {
  entries: Record<string, any[]> | null;
  repoState: RepoState | null;
}

export async function fetchAppCoCharts(
  store: VuexStore,
  repoName: string,
  onStateChange?: (state: RepoState) => void,
  // Used to stop on unmount or when repoName changes
  signal?: AbortSignal
): Promise<FetchChartsResult> {
  const { repo, state: repoState } = await waitForRepoReady(store, repoName, { onStateChange, signal });

  if (!repo) {
    return { entries: null, repoState };
  }

  const index = await repo.followLink('index');
  const entries = index?.entries || {};

  return { entries, repoState };
}

export function deriveRepoName(secretName: string): string {
  return secretName ? secretName.replace('auth', 'repo') : '';
}
