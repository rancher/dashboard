import { actions } from '@shell/store/linode';

function makeCtx(dispatchImpl?: (...args: any[]) => any) {
  const dispatch = jest.fn(dispatchImpl);
  const commit = jest.fn();
  const state = { cache: {} };
  const getters = { fromCache: () => undefined };

  return {
    ctx: {
      state, commit, dispatch, getters, rootGetters: { 'i18n/t': (key: string, args: any) => `${ key }:${ JSON.stringify(args) }` }
    },
    dispatch,
    commit,
  };
}

describe('linode store', () => {
  describe('regionOptions', () => {
    it('filters out regions that are not "ok" status', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [
          { id: 'us-east', status: 'ok' },
          { id: 'us-west', status: 'outage' },
        ],
      });

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([{ label: 'us-east', value: 'us-east' }]);
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'regions' });
    });

    it('sorts the resulting options by label', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [
          { id: 'us-west', status: 'ok' },
          { id: 'ap-south', status: 'ok' },
        ],
      });

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([
        { label: 'ap-south', value: 'ap-south' },
        { label: 'us-west', value: 'us-west' },
      ]);
    });

    it('returns an empty array when no regions qualify', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({ data: [{ id: 'us-east', status: 'outage' }] });

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('instanceOptions', () => {
    it('maps type fields into option shape and builds label via i18n/t rootGetter', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [{
          class: 'standard', label: 'Linode 2GB', memory: 2048, disk: 51200, vcpus: 1, id: 'g6-standard-1'
        }],
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        class:    'standard',
        label:    'cluster.machineConfig.linode.typeLabel:{"class":"standard","label":"Linode 2GB","memoryGb":2048,"disk":50,"vcpus":1,"value":"g6-standard-1"}',
        memoryGb: 2048,
        disk:     50,
        vcpus:    1,
        value:    'g6-standard-1',
      });
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'linode/types' });
    });

    it('sorts by class, memoryGb, vcpus, disk', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [
          {
            class: 'standard', label: 'B', memory: 4096, disk: 81920, vcpus: 2, id: 'g6-standard-2'
          },
          {
            class: 'dedicated', label: 'A', memory: 2048, disk: 51200, vcpus: 1, id: 'g6-dedicated-1'
          },
        ],
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result.map((r: any) => r.value)).toStrictEqual(['g6-dedicated-1', 'g6-standard-2']);
    });

    it('returns an empty array when there are no types', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({ data: [] });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('imageOptions', () => {
    it('filters out images that are not "available" status', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [
          {
            id: 'linode/ubuntu20.04', label: 'Ubuntu 20.04', status: 'available'
          },
          {
            id: 'linode/centos7', label: 'CentOS 7', status: 'creating'
          },
        ],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([{ label: 'Ubuntu 20.04', value: 'linode/ubuntu20.04' }]);
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'images' });
    });

    it('sorts the resulting options by label', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [
          {
            id: 'linode/ubuntu20.04', label: 'Ubuntu 20.04', status: 'available'
          },
          {
            id: 'linode/debian11', label: 'Debian 11', status: 'available'
          },
        ],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([
        { label: 'Debian 11', value: 'linode/debian11' },
        { label: 'Ubuntu 20.04', value: 'linode/ubuntu20.04' },
      ]);
    });

    it('returns an empty array when no images qualify', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        data: [{
          id: 'linode/centos7', label: 'CentOS 7', status: 'creating'
        }]
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('cachedCommand', () => {
    it('returns the cached value and skips dispatching "request" when present in cache', async() => {
      const cachedValue = { data: [] };
      const { dispatch, commit } = makeCtx();
      const ctx = {
        state:   { cache: {} },
        commit,
        dispatch,
        getters: { fromCache: () => cachedValue },
      };

      const result = await actions.cachedCommand(ctx as any, { credentialId: 'cred-1', command: 'regions' });

      expect(result).toStrictEqual(cachedValue);
      expect(dispatch).not.toHaveBeenCalledWith();
      expect(commit).not.toHaveBeenCalledWith();
    });

    it('dispatches "request" and commits the result to cache when absent from cache', async() => {
      const freshValue = { data: [{ id: 'us-east' }] };
      const { dispatch, commit } = makeCtx();

      dispatch.mockResolvedValue(freshValue);
      const ctx = {
        state:   { cache: {} },
        commit,
        dispatch,
        getters: { fromCache: () => undefined },
      };

      const result = await actions.cachedCommand(ctx as any, { credentialId: 'cred-1', command: 'regions' });

      expect(result).toStrictEqual(freshValue);
      expect(dispatch).toHaveBeenCalledWith('request', { credentialId: 'cred-1', command: 'regions' });
      expect(commit).toHaveBeenCalledWith('setCache', {
        credentialId: 'cred-1', key: 'regions', value: freshValue
      });
    });
  });
});
