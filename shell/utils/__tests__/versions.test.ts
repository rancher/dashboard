function makeStoreWithCalls(rancherPromise: Promise<any>, kubePromise: Promise<any>) {
  let callCount = 0;

  return {
    dispatch: jest.fn(() => {
      callCount++;

      return callCount === 1 ? rancherPromise : kubePromise;
    }),
  };
}

describe('versions', () => {
  let versions: any;
  let mockSetVersionData: jest.Mock;
  let mockSetKubeVersionData: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockSetVersionData = jest.fn();
    mockSetKubeVersionData = jest.fn();
    jest.mock('@shell/config/version', () => ({
      setVersionData:     mockSetVersionData,
      setKubeVersionData: mockSetKubeVersionData,
    }));
    versions = require('@shell/utils/versions').default;
  });

  describe('fetch', () => {
    it('dispatches rancher/request for /rancherversion', async() => {
      const store = { dispatch: jest.fn(() => Promise.resolve({})) };

      await versions.fetch({ store });

      expect(store.dispatch).toHaveBeenCalledWith('rancher/request', {
        url:                  '/rancherversion',
        method:               'get',
        redirectUnauthorized: false,
      });
    });

    it('dispatches rancher/request for /version', async() => {
      const store = { dispatch: jest.fn(() => Promise.resolve({})) };

      await versions.fetch({ store });

      expect(store.dispatch).toHaveBeenCalledWith('rancher/request', {
        url:                  '/version',
        method:               'get',
        redirectUnauthorized: false,
      });
    });

    it('calls setVersionData with the rancher version response', async() => {
      const rancherResponse = { Version: '2.9.0', GitCommit: 'abc123' };
      const store = makeStoreWithCalls(Promise.resolve(rancherResponse), Promise.resolve({}));

      await versions.fetch({ store });

      expect(mockSetVersionData).toHaveBeenCalledWith(rancherResponse);
    });

    it('calls setKubeVersionData with the kube version response', async() => {
      const kubeResponse = { gitVersion: 'v1.29.0' };
      const store = makeStoreWithCalls(Promise.resolve({}), Promise.resolve(kubeResponse));

      await versions.fetch({ store });

      expect(mockSetKubeVersionData).toHaveBeenCalledWith(kubeResponse);
    });

    it('caches the promise — second call does not dispatch again', async() => {
      const store = { dispatch: jest.fn(() => Promise.resolve({})) };

      await versions.fetch({ store });
      await versions.fetch({ store });

      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    it('returns the same promise object on repeated calls', () => {
      const store = { dispatch: jest.fn(() => Promise.resolve({})) };

      versions.fetch({ store });
      versions.fetch({ store });

      // Both initial calls should dispatch only twice total (2 endpoints, cached after that)
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      // Third fetch should not dispatch additional times
      versions.fetch({ store });
      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    it('does not throw when rancher request fails', async() => {
      const store = makeStoreWithCalls(Promise.reject(new Error('network error')), Promise.resolve({}));

      await expect(versions.fetch({ store })).resolves.not.toThrow();
    });

    it('does not throw when kube request fails', async() => {
      const store = makeStoreWithCalls(Promise.resolve({}), Promise.reject(new Error('network error')));

      await expect(versions.fetch({ store })).resolves.not.toThrow();
    });

    it('logs a warning when rancher request fails', async() => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('rancher down');
      const store = makeStoreWithCalls(Promise.reject(error), Promise.resolve({}));

      await versions.fetch({ store });

      expect(warnSpy).toHaveBeenCalledWith('Failed to fetch Rancher version metadata', error);
      warnSpy.mockRestore();
    });

    it('logs a warning when kube request fails', async() => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('kube down');
      const store = makeStoreWithCalls(Promise.resolve({}), Promise.reject(error));

      await versions.fetch({ store });

      expect(warnSpy).toHaveBeenCalledWith('Failed to fetch Kube version metadata', error);
      warnSpy.mockRestore();
    });
  });
});
