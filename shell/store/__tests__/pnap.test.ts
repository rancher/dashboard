import { actions } from '@shell/store/pnap';

function makeCtx(dispatchImpl?: (...args: any[]) => any) {
  const dispatch = jest.fn(dispatchImpl);
  const commit = jest.fn();
  const state = { cache: {} };
  const getters = { fromCache: () => undefined };

  return {
    ctx: {
      state, commit, dispatch, getters
    },
    dispatch,
    commit,
  };
}

describe('pnap store', () => {
  describe('osChoices', () => {
    it('maps an operatingSystems array into deduplicated value/label options', async() => {
      const osListResponse = { operatingSystems: ['ubuntu/focal', 'centos/8', 'ubuntu/focal'] };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(osListResponse);

      const result = await actions.osChoices(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([
        { value: 'ubuntu/focal', label: 'ubuntu/focal' },
        { value: 'centos/8', label: 'centos/8' },
      ]);
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'rancher-node-driver/options' });
    });

    it('returns a single message option when operatingSystems is not an array', async() => {
      const osListResponse = { message: 'no credentials configured' };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(osListResponse);

      const result = await actions.osChoices(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([{ value: 'no credentials configured' }]);
    });
  });

  describe('allProducts', () => {
    it('passes through the result of the "billing/v1/products" cachedCommand dispatch', async() => {
      const productsResponse = { results: [{ productCode: 'server-1' }] };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(productsResponse);

      const result = await actions.allProducts(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual(productsResponse);
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'billing/v1/products?productCategory=SERVER' });
    });
  });

  describe('cachedCommand', () => {
    it('returns the cached value and skips dispatching "request" when present in cache', async() => {
      const cachedValue = { operatingSystems: [] };
      const { dispatch, commit } = makeCtx();
      const ctx = {
        state:   { cache: {} },
        commit,
        dispatch,
        getters: { fromCache: () => cachedValue },
      };

      const result = await actions.cachedCommand(ctx as any, { credentialId: 'cred-1', command: 'rancher-node-driver/options' });

      expect(result).toStrictEqual(cachedValue);
      expect(dispatch).not.toHaveBeenCalledWith();
      expect(commit).not.toHaveBeenCalledWith();
    });

    it('dispatches "request" and commits the result to cache when absent from cache', async() => {
      const freshValue = { operatingSystems: ['ubuntu/focal'] };
      const { dispatch, commit } = makeCtx();

      dispatch.mockResolvedValue(freshValue);
      const ctx = {
        state:   { cache: {} },
        commit,
        dispatch,
        getters: { fromCache: () => undefined },
      };

      const result = await actions.cachedCommand(ctx as any, { credentialId: 'cred-1', command: 'rancher-node-driver/options' });

      expect(result).toStrictEqual(freshValue);
      expect(dispatch).toHaveBeenCalledWith('request', { credentialId: 'cred-1', command: 'rancher-node-driver/options' });
      expect(commit).toHaveBeenCalledWith('setCache', {
        credentialId: 'cred-1', key: 'rancher-node-driver/options', value: freshValue
      });
    });
  });
});
