import { actions } from '@shell/store/digitalocean';

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

describe('digitalocean store', () => {
  describe('regionOptions', () => {
    it('filters out unavailable regions and those without metadata feature', async() => {
      const regionsResponse = {
        regions: [
          {
            name: 'New York', slug: 'nyc1', available: true, features: ['metadata']
          },
          {
            name: 'Unavailable', slug: 'unavail1', available: false, features: ['metadata']
          },
          {
            name: 'No Metadata', slug: 'nometa1', available: true, features: ['ipv6']
          },
        ],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(regionsResponse);

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([{ label: 'New York', value: 'nyc1' }]);
      expect(dispatch).toHaveBeenCalledWith('cachedCommand', { credentialId: 'cred-1', command: 'regions' });
    });

    it('sorts the resulting options by label', async() => {
      const regionsResponse = {
        regions: [
          {
            name: 'Zurich', slug: 'zrh1', available: true, features: ['metadata']
          },
          {
            name: 'Amsterdam', slug: 'ams1', available: true, features: ['metadata']
          },
        ],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(regionsResponse);

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([
        { label: 'Amsterdam', value: 'ams1' },
        { label: 'Zurich', value: 'zrh1' },
      ]);
    });

    it('returns an empty array when no regions qualify', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({ regions: [] });

      const result = await actions.regionOptions(ctx as any, { credentialId: 'cred-1' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('instanceOptions', () => {
    it.each([
      {
        desc:     'slug prefixed with "s-"',
        slug:     's-1vcpu-1gb',
        expected: 's',
      },
      {
        desc:     'slug prefixed with "g-"',
        slug:     'g-2vcpu-8gb',
        expected: 'g',
      },
      {
        desc:     'slug prefixed with "gd-"',
        slug:     'gd-2vcpu-8gb',
        expected: 'gd',
      },
      {
        desc:     'slug prefixed with "c-"',
        slug:     'c-2',
        expected: 'c',
      },
      {
        desc:     'slug prefixed with "m-"',
        slug:     'm-2vcpu-16gb',
        expected: 'm',
      },
      {
        desc:     'slug prefixed with "so-"',
        slug:     'so-2vcpu-16gb',
        expected: 'so',
      },
      {
        desc:     'slug with a dash but no recognized prefix',
        slug:     'premium-intel-1vcpu-1gb',
        expected: 'standard',
      },
    ])('derives plan "$expected" for $desc', async({ slug, expected }) => {
      const regionsResponse = { regions: [{ slug: 'nyc1', sizes: [slug] }] };
      const sizesResponse = {
        sizes: [{
          slug, memory: 1024, disk: 25, vcpus: 1
        }],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockImplementation((action: string, { command }: any) => {
        if (command === 'regions') return Promise.resolve(regionsResponse);
        if (command === 'sizes') return Promise.resolve(sizesResponse);

        return Promise.resolve(undefined);
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toHaveLength(1);
      expect(result[0].plan).toStrictEqual(expected);
    });

    it('filters out sizes whose plan resolves to "other"', async() => {
      const regionsResponse = { regions: [{ slug: 'nyc1', sizes: ['nodash'] }] };
      const sizesResponse = {
        sizes: [{
          slug: 'nodash', memory: 1024, disk: 25, vcpus: 1
        }],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockImplementation((action: string, { command }: any) => {
        if (command === 'regions') return Promise.resolve(regionsResponse);
        if (command === 'sizes') return Promise.resolve(sizesResponse);

        return Promise.resolve(undefined);
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([]);
    });

    it('filters sizes not available in the requested region', async() => {
      const regionsResponse = { regions: [{ slug: 'nyc1', sizes: ['s-1vcpu-1gb'] }] };
      const sizesResponse = {
        sizes: [
          {
            slug: 's-1vcpu-1gb', memory: 1024, disk: 25, vcpus: 1
          },
          {
            slug: 's-2vcpu-2gb', memory: 2048, disk: 50, vcpus: 2
          },
        ],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockImplementation((action: string, { command }: any) => {
        if (command === 'regions') return Promise.resolve(regionsResponse);
        if (command === 'sizes') return Promise.resolve(sizesResponse);

        return Promise.resolve(undefined);
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toHaveLength(1);
      expect(result[0].value).toStrictEqual('s-1vcpu-1gb');
    });

    it('converts memory from MB to GB and sorts by planSort, memoryGb, vcpus, disk', async() => {
      const regionsResponse = { regions: [{ slug: 'nyc1', sizes: ['s-1vcpu-1gb', 'g-2vcpu-8gb'] }] };
      const sizesResponse = {
        sizes: [
          {
            slug: 'g-2vcpu-8gb', memory: 8192, disk: 50, vcpus: 2
          },
          {
            slug: 's-1vcpu-1gb', memory: 1024, disk: 25, vcpus: 1
          },
        ],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockImplementation((action: string, { command }: any) => {
        if (command === 'regions') return Promise.resolve(regionsResponse);
        if (command === 'sizes') return Promise.resolve(sizesResponse);

        return Promise.resolve(undefined);
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      // 's' plan sorts before 'g' plan per PLAN_SORTS
      expect(result.map((r: any) => r.value)).toStrictEqual(['s-1vcpu-1gb', 'g-2vcpu-8gb']);
      expect(result[0].memoryGb).toStrictEqual(1);
      expect(result[1].memoryGb).toStrictEqual(8);
    });

    it('builds the label using the i18n/t rootGetter with the computed size fields', async() => {
      const regionsResponse = { regions: [{ slug: 'nyc1', sizes: ['s-1vcpu-1gb'] }] };
      const sizesResponse = {
        sizes: [{
          slug: 's-1vcpu-1gb', memory: 1024, disk: 25, vcpus: 1
        }],
      };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockImplementation((action: string, { command }: any) => {
        if (command === 'regions') return Promise.resolve(regionsResponse);
        if (command === 'sizes') return Promise.resolve(sizesResponse);

        return Promise.resolve(undefined);
      });

      const result = await actions.instanceOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result[0].label).toContain('cluster.machineConfig.digitalocean.sizeLabel');
      expect(result[0].label).toContain('"value":"s-1vcpu-1gb"');
    });
  });

  describe('imageOptions', () => {
    it.each([
      {
        desc:     'valid centos slug',
        slug:     'centos-8-x64',
        expected: true,
      },
      {
        desc:     'valid debian slug',
        slug:     'debian-11-x64',
        expected: true,
      },
      {
        desc:     'valid fedora slug',
        slug:     'fedora-35-x64',
        expected: true,
      },
      {
        desc:     'valid ubuntu slug',
        slug:     'ubuntu-20-04-x64',
        expected: true,
      },
      {
        desc:     'x32 slug is rejected regardless of other matches',
        slug:     'ubuntu-20-04-x32',
        expected: false,
      },
      {
        desc:     'unrecognized distro slug',
        slug:     'windows-2019-x64',
        expected: false,
      },
    ])('$desc is handled as expected=$expected', async({ slug, expected }) => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug, regions: ['nyc1'], status: 'available', distribution: 'Test', name: 'Image'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toHaveLength(expected ? 1 : 0);
    });

    it('excludes images without a slug', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: '', regions: ['nyc1'], status: 'available'
        }]
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([]);
    });

    it('excludes images not available in the requested region', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: 'ubuntu-20-04-x64', regions: ['sfo1'], status: 'available'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([]);
    });

    it('excludes images that are not in "available" status', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: 'ubuntu-20-04-x64', regions: ['nyc1'], status: 'pending'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([]);
    });

    it('builds label from distribution and name, stripping "image"/"x86"/"x64" suffixes', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: 'ubuntu-20-04-x64', regions: ['nyc1'], status: 'available', distribution: 'Ubuntu', name: '20.04 image x64'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([{ label: 'Ubuntu 20.04', value: 'ubuntu-20-04-x64' }]);
    });

    it('falls back to description when name is missing', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: 'debian-11-x64', regions: ['nyc1'], status: 'available', distribution: 'Debian', description: '11 Bullseye'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([{ label: 'Debian 11 Bullseye', value: 'debian-11-x64' }]);
    });

    it('falls back to the slug as label when distribution and name/description are both empty', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [{
          slug: 'centos-8-x64', regions: ['nyc1'], status: 'available'
        }],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result).toStrictEqual([{ label: 'centos-8-x64', value: 'centos-8-x64' }]);
    });

    it('sorts results by label then value', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue({
        images: [
          {
            slug: 'ubuntu-20-04-x64', regions: ['nyc1'], status: 'available', distribution: 'Ubuntu', name: '20.04'
          },
          {
            slug: 'debian-11-x64', regions: ['nyc1'], status: 'available', distribution: 'Debian', name: '11'
          },
        ],
      });

      const result = await actions.imageOptions(ctx as any, { credentialId: 'cred-1', region: 'nyc1' });

      expect(result.map((r: any) => r.value)).toStrictEqual(['debian-11-x64', 'ubuntu-20-04-x64']);
    });
  });

  describe('cachedCommand', () => {
    it('returns the cached value and skips dispatching "request" when present in cache', async() => {
      const cachedValue = { regions: [] };
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
      const freshValue = { regions: [{ slug: 'nyc1' }] };
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
