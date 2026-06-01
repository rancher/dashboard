import ClusterRepo from '../catalog.cattle.io.clusterrepo';

describe('clusterRepo', () => {
  let model: any;

  beforeEach(() => {
    model = new ClusterRepo({
      metadata: { name: 'test-repo' },
      spec:     { url: 'https://test-url.com' }
    }, {
      getters:     {},
      dispatch:    jest.fn(),
      rootGetters: {}
    });

    jest.spyOn(model, '_key', 'get').mockReturnValue('test-key');
    jest.spyOn(model, 'save').mockImplementation().mockResolvedValue(true);
    jest.spyOn(model, 'waitForState').mockImplementation().mockResolvedValue(true);
    jest.spyOn(model, '$dispatch', 'get').mockReturnValue(jest.fn());
  });

  describe('refresh', () => {
    it('updates forceUpdate, saves, waits for active state, and dispatches load by default', async() => {
      // Mock Date to ensure deterministic forceUpdate value
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await model.refresh();

      expect(model.spec.forceUpdate).toBe('2023-01-01T12:00:00Z');
      expect(model.save).toHaveBeenCalledWith();
      expect(model.waitForState).toHaveBeenCalledWith('active', 10000, 1000);
      expect(model.$dispatch).toHaveBeenCalledWith('catalog/load', { force: true, repoKeys: [model._key] }, { root: true });

      spy.mockRestore();
    });

    it('updates forceUpdate, saves, waits for active state, but DOES NOT dispatch load if dispatchLoad is false', async() => {
      await model.refresh(false);

      expect(model.save).toHaveBeenCalledWith();
      expect(model.waitForState).toHaveBeenCalledWith('active', 10000, 1000);
      expect(model.$dispatch).not.toHaveBeenCalled();
    });

    it('dispatches error to growl if save or waitForState fails', async() => {
      const error = new Error('waitForState timeout');

      model.waitForState.mockRejectedValue(error);
      jest.spyOn(model, 't', 'get').mockReturnValue(jest.fn().mockReturnValue('Error refreshing repository'));
      jest.spyOn(model, 'nameDisplay', 'get').mockReturnValue('Test Repo');

      await model.refresh();

      expect(model.$dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'Error refreshing repository',
        err:   error
      }, { root: true });
    });
  });

  describe('refreshBulk', () => {
    it('calls refresh(false) on all items and then dispatches a single catalog/load with all repoKeys', async() => {
      const mockItem1 = {
        _key:    'repo-1',
        refresh: jest.fn().mockResolvedValue(true)
      };
      const mockItem2 = {
        _key:    'repo-2',
        refresh: jest.fn().mockResolvedValue(true)
      };

      await model.refreshBulk([mockItem1, mockItem2]);

      expect(mockItem1.refresh).toHaveBeenCalledWith(false);
      expect(mockItem2.refresh).toHaveBeenCalledWith(false);

      expect(model.$dispatch).toHaveBeenCalledWith('catalog/load', {
        force:    true,
        repoKeys: ['repo-1', 'repo-2']
      }, { root: true });
    });
  });
});
