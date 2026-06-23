import {
  deriveRepoName, fetchAppCoCharts, ensureAppCoResources, ensureAppCoImagePullSecret, getDownstreamResourcesDocsUrl, FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL
} from '@shell/utils/fleet-appco';
import { SECRET, CATALOG as CATALOG_TYPES } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';

/**
 * Build a fake ClusterRepo resource. Its `waitForTestFn` emulates the real
 * resource-class helper by synchronously polling the provided test function
 * until it returns truthy (or "timing out" after a few attempts).
 */
const buildRepo = (overrides: Record<string, any> = {}) => ({
  metadata:        { state: {} },
  status:          { conditions: [] },
  stateDisplay:    'Active',
  stateBackground: 'bg-success',
  followLink:      jest.fn().mockResolvedValue({ entries: { chartA: [{ name: 'chartA' }] } }),
  waitForTestFn:   (fn: () => boolean) => new Promise<void>((resolve, reject) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (fn()) {
        return resolve();
      }
    }

    reject(new Error('timed out'));
  }),
  ...overrides,
});

const buildStore = (repo: any, { findRejects = false, findRejectStatus = 404 }: { findRejects?: boolean; findRejectStatus?: number } = {}) => ({
  dispatch: jest.fn((action: string) => {
    if (action.endsWith('/find')) {
      return findRejects ? Promise.reject(Object.assign(new Error('not found'), { status: findRejectStatus })) : Promise.resolve(repo);
    }

    return Promise.resolve();
  }),
  getters: new Proxy({}, {
    get: (_target, prop) => {
      if (String(prop).endsWith('/byId')) {
        return () => repo;
      }

      return undefined;
    }
  }),
});

describe('fleet-appco utils', () => {
  describe('deriveRepoName', () => {
    it.each([
      ['my-auth-secret', 'my-repo-secret'],
      ['auth-token', 'repo-token'],
      ['some-auth', 'some-repo'],
    ])('should replace "auth" with "repo" in %s', (input, expected) => {
      expect(deriveRepoName(input)).toStrictEqual(expected);
    });

    it('should return empty string for empty input', () => {
      expect(deriveRepoName('')).toStrictEqual('');
    });
  });

  describe('getDownstreamResourcesDocsUrl', () => {
    it.each([
      ['v2.15.0', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['2.15.0', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.16.3', 'https://fleet.rancher.io/0.17/downstream-resources'],
      ['v2.15.0-rc1', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.15-head', 'https://fleet.rancher.io/0.16/downstream-resources'],
      ['v2.20.0', 'https://fleet.rancher.io/0.21/downstream-resources'],
    ])('should map Rancher %s to Fleet docs %s', (version, expected) => {
      expect(getDownstreamResourcesDocsUrl(version)).toStrictEqual(expected);
    });

    it.each([
      ['v2.14.0'],
      ['v2.9.0'],
      ['dev'],
      [''],
      [undefined],
    ])('should fall back to the unversioned docs for %s', (version) => {
      expect(getDownstreamResourcesDocsUrl(version)).toStrictEqual(FLEET_DOWNSTREAM_RESOURCES_DOCS_FALLBACK_URL);
    });
  });

  describe('fetchAppCoCharts', () => {
    it('should return entries once the repo OCIDownloaded condition is True', async() => {
      const repo = buildRepo({ status: { conditions: [{ type: 'OCIDownloaded', status: 'True' }] } });
      const store = buildStore(repo);
      const onStateChange = jest.fn();

      const result = await fetchAppCoCharts(store as any, 'my-repo', onStateChange);

      expect(result.entries).toStrictEqual({ chartA: [{ name: 'chartA' }] });
      expect(result.repoState).toStrictEqual(expect.objectContaining({
        repoName: 'my-repo', transitioning: false, error: false
      }));
      expect(repo.followLink).toHaveBeenCalledWith('index');
      expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ repoName: 'my-repo', error: false }));
    });

    it('should return no entries and an error state when the repo reports an error', async() => {
      const repo = buildRepo({ metadata: { state: { error: true, message: 'boom' } } });
      const store = buildStore(repo);

      const result = await fetchAppCoCharts(store as any, 'my-repo');

      expect(result.entries).toBeNull();
      expect(result.repoState).toStrictEqual(expect.objectContaining({
        repoName: 'my-repo', error: true, errorMessage: 'boom'
      }));
      expect(repo.followLink).not.toHaveBeenCalled();
    });

    it('should flag notFound when the repo does not exist (404)', async() => {
      const repo = buildRepo();
      const store = buildStore(repo, { findRejects: true, findRejectStatus: 404 });

      const result = await fetchAppCoCharts(store as any, 'my-repo');

      expect(result.entries).toBeNull();
      expect(result.repoState).toBeNull();
      expect(result.notFound).toStrictEqual(true);
    });

    it('should not flag notFound when the repo lookup fails for another reason', async() => {
      const repo = buildRepo();
      const store = buildStore(repo, { findRejects: true, findRejectStatus: 500 });

      const result = await fetchAppCoCharts(store as any, 'my-repo');

      expect(result.entries).toBeNull();
      expect(result.repoState).toBeNull();
      expect(result.notFound).toStrictEqual(false);
    });

    it('should stop and return no entries when the signal is aborted', async() => {
      const repo = buildRepo();
      const store = buildStore(repo);
      const controller = new AbortController();

      controller.abort();

      const result = await fetchAppCoCharts(store as any, 'my-repo', undefined, controller.signal);

      expect(result.entries).toBeNull();
      expect(result.repoState).toBeNull();
      expect(repo.followLink).not.toHaveBeenCalled();
    });
  });

  describe('ensureAppCoResources', () => {
    const NAMESPACE = 'ns';
    const AUTH_SECRET_NAME = 'fleet-appco-auth-x';
    const AUTH_SECRET_ID = `${ NAMESPACE }/${ AUTH_SECRET_NAME }`;

    const t = (key: string) => key;

    const authSecret = { decodedData: { username: 'user', password: 'pass' } };

    /**
     * Build a store where the auth-secret existence can be controlled, while the
     * image-pull secret and ClusterRepo are always absent (forcing their creation).
     */
    const buildResourcesStore = ({ secretInCache = false, secretFindResolves = false } = {}) => {
      const newResource = () => ({
        setData: jest.fn(),
        save:    jest.fn().mockResolvedValue(undefined),
      });

      const dispatch = jest.fn((action: string, payload?: any) => {
        if (action.endsWith('/create')) {
          return Promise.resolve(newResource());
        }

        if (action.endsWith('/find')) {
          // The auth secret resolves via `find` whenever it exists (it is also
          // re-fetched by ensureAppCoImagePullSecret to read its credentials).
          if (payload?.id === AUTH_SECRET_ID) {
            return secretInCache || secretFindResolves ? Promise.resolve(authSecret) : Promise.reject(new Error('not found'));
          }

          // Image-pull secret / ClusterRepo are absent so creation is triggered.
          return Promise.reject(new Error('not found'));
        }

        return Promise.resolve();
      });

      const getters = new Proxy({}, {
        get: (_target, prop) => {
          if (String(prop).endsWith('/byId')) {
            return (_type: string, id: string) => (secretInCache && id === AUTH_SECRET_ID ? authSecret : undefined);
          }

          return undefined;
        }
      });

      return { dispatch, getters };
    };

    it('should return false and create nothing when the auth secret cannot be found', async() => {
      const store = buildResourcesStore({ secretInCache: false, secretFindResolves: false });

      const result = await ensureAppCoResources(store as any, AUTH_SECRET_NAME, NAMESPACE, t);

      expect(result).toStrictEqual(false);
      expect(store.dispatch).not.toHaveBeenCalledWith('management/create', expect.anything());
    });

    it('should ensure the image-pull secret and ClusterRepo when the auth secret is in cache', async() => {
      const store = buildResourcesStore({ secretInCache: true });

      const result = await ensureAppCoResources(store as any, AUTH_SECRET_NAME, NAMESPACE, t);

      expect(result).toStrictEqual(true);
      expect(store.dispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({
        type:  SECRET,
        _type: SECRET_TYPES.DOCKER_JSON,
      }));
      expect(store.dispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({ type: CATALOG_TYPES.CLUSTER_REPO }));
    });

    it('should ensure resources when the auth secret resolves via find', async() => {
      const store = buildResourcesStore({ secretInCache: false, secretFindResolves: true });

      const result = await ensureAppCoResources(store as any, AUTH_SECRET_NAME, NAMESPACE, t);

      expect(result).toStrictEqual(true);
      expect(store.dispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({ type: CATALOG_TYPES.CLUSTER_REPO }));
    });
  });

  describe('ensureAppCoImagePullSecret', () => {
    const NAMESPACE = 'ns';
    const AUTH_SECRET_NAME = 'fleet-appco-auth-x';
    const AUTH_SECRET_ID = `${ NAMESPACE }/${ AUTH_SECRET_NAME }`;
    const PULL_SECRET_NAME = `${ AUTH_SECRET_NAME }-image-pull-secret`;
    const PULL_SECRET_ID = `${ NAMESPACE }/${ PULL_SECRET_NAME }`;

    const authSecret = { decodedData: { username: 'user', password: 'pass' } };

    const buildPullSecretStore = ({ pullSecretExists = false, authFindResolves = true } = {}) => {
      const newSecret = { setData: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };

      const dispatch = jest.fn((action: string, payload?: any) => {
        if (action.endsWith('/create')) {
          return Promise.resolve(newSecret);
        }

        if (action.endsWith('/find')) {
          if (payload?.id === AUTH_SECRET_ID) {
            return authFindResolves ? Promise.resolve(authSecret) : Promise.reject(new Error('not found'));
          }

          // The image-pull secret is never resolved via `find` here.
          return Promise.reject(new Error('not found'));
        }

        return Promise.resolve();
      });

      const getters = new Proxy({}, {
        get: (_target, prop) => {
          if (String(prop).endsWith('/byId')) {
            return (_type: string, id: string) => (pullSecretExists && id === PULL_SECRET_ID ? {} : undefined);
          }

          return undefined;
        }
      });

      return {
        dispatch, getters, newSecret
      };
    };

    it('should no-op when the image-pull secret already exists', async() => {
      const store = buildPullSecretStore({ pullSecretExists: true });

      const result = await ensureAppCoImagePullSecret(store as any, AUTH_SECRET_NAME, NAMESPACE);

      expect(result).toStrictEqual(PULL_SECRET_NAME);
      expect(store.dispatch).not.toHaveBeenCalledWith('management/create', expect.anything());
    });

    it('should create the image-pull secret from the auth secret when it is missing', async() => {
      const store = buildPullSecretStore({ pullSecretExists: false, authFindResolves: true });

      const result = await ensureAppCoImagePullSecret(store as any, AUTH_SECRET_NAME, NAMESPACE);

      expect(result).toStrictEqual(PULL_SECRET_NAME);
      expect(store.dispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({
        type:  SECRET,
        _type: SECRET_TYPES.DOCKER_JSON,
      }));
      expect(store.newSecret.setData).toHaveBeenCalledWith('.dockerconfigjson', expect.stringContaining('"username":"user"'));
      expect(store.newSecret.save).toHaveBeenCalledWith();
    });

    it('should skip creation when the auth secret cannot be found', async() => {
      const store = buildPullSecretStore({ pullSecretExists: false, authFindResolves: false });

      const result = await ensureAppCoImagePullSecret(store as any, AUTH_SECRET_NAME, NAMESPACE);

      expect(result).toBeUndefined();
      expect(store.dispatch).not.toHaveBeenCalledWith('management/create', expect.anything());
    });
  });
});
