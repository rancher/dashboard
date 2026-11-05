import { getters, mutations, actions } from '@shell/store/aws';

function makeCtx(overrides: Partial<Record<string, any>> = {}) {
  const dispatch = jest.fn();
  const commit = jest.fn();
  const state = { instanceTypes: [], clientInfo: null };
  const rootGetters: Record<string, any> = {
    'i18n/t':            (key: string, args: any) => `${ key }:${ JSON.stringify(args) }`,
    'aws/clientInfo':    null,
    'aws/instanceTypes': [],
    ...overrides.rootGetters,
  };

  return {
    ctx: {
      state, commit, dispatch, rootGetters
    },
    dispatch,
    commit,
    state,
  };
}

describe('aws store', () => {
  describe('getters', () => {
    it('defaultRegion returns us-west-2', () => {
      expect(getters.defaultRegion()).toStrictEqual('us-west-2');
    });

    it('defaultInstanceType returns t3a.medium', () => {
      expect(getters.defaultInstanceType()).toStrictEqual('t3a.medium');
    });

    it('instanceTypes returns state.instanceTypes', () => {
      const state = { instanceTypes: [{ apiName: 'm5.large' }], clientInfo: null };

      expect(getters.instanceTypes(state as any)).toStrictEqual([{ apiName: 'm5.large' }]);
    });

    it('clientInfo returns state.clientInfo', () => {
      const state = { instanceTypes: [], clientInfo: { region: 'us-east-1', cloudCredentialId: 'cc-1' } };

      expect(getters.clientInfo(state as any)).toStrictEqual({ region: 'us-east-1', cloudCredentialId: 'cc-1' });
    });
  });

  describe('mutations', () => {
    it('setInstanceTypes sets instanceTypes and clientInfo on state', () => {
      const state = { instanceTypes: [], clientInfo: null };
      const types = [{ apiName: 'm5.large' }];
      const clientInfo = { region: 'us-east-1', cloudCredentialId: 'cc-1' };

      mutations.setInstanceTypes(state as any, { types, clientInfo });

      expect(state.instanceTypes).toStrictEqual(types);
      expect(state.clientInfo).toStrictEqual(clientInfo);
    });
  });

  describe('defaultRegions', () => {
    it('returns the aws-regions.json data', async() => {
      const result = await (actions.defaultRegions as any)();

      expect(Array.isArray(result)).toStrictEqual(true);
      expect(result).toContain('us-west-2');
    });
  });

  describe('depaginateList', () => {
    it('collects a single page of results using the found array key', async() => {
      const { ctx } = makeCtx();
      const client = { describeInstanceTypes: jest.fn().mockResolvedValue({ InstanceTypes: [{ InstanceType: 'm5.large' }] }) };

      const result = await actions.depaginateList(ctx as any, {
        client, cmd: 'describeInstanceTypes', key: undefined, opt: undefined
      });

      expect(result).toStrictEqual([{ InstanceType: 'm5.large' }]);
      expect(client.describeInstanceTypes).toHaveBeenCalledTimes(1);
    });

    it('paginates using NextToken until it is absent', async() => {
      const { ctx } = makeCtx();
      const client = {
        describeInstanceTypes: jest.fn()
          .mockResolvedValueOnce({ InstanceTypes: [{ InstanceType: 'm5.large' }], NextToken: 'token-1' })
          .mockResolvedValueOnce({ InstanceTypes: [{ InstanceType: 'm5.xlarge' }] }),
      };

      const result = await actions.depaginateList(ctx as any, {
        client, cmd: 'describeInstanceTypes', key: undefined, opt: undefined
      });

      expect(result).toStrictEqual([{ InstanceType: 'm5.large' }, { InstanceType: 'm5.xlarge' }]);
      expect(client.describeInstanceTypes).toHaveBeenCalledTimes(2);
      expect(client.describeInstanceTypes).toHaveBeenNthCalledWith(2, { NextToken: 'token-1' });
    });

    it('paginates using Marker until it is absent', async() => {
      const { ctx } = makeCtx();
      const client = {
        listRoles: jest.fn()
          .mockResolvedValueOnce({ Roles: [{ RoleName: 'role-a' }], Marker: 'marker-1' })
          .mockResolvedValueOnce({ Roles: [{ RoleName: 'role-b' }] }),
      };

      const result = await actions.depaginateList(ctx as any, {
        client, cmd: 'listRoles', key: undefined, opt: undefined
      });

      expect(result).toStrictEqual([{ RoleName: 'role-a' }, { RoleName: 'role-b' }]);
      expect(client.listRoles).toHaveBeenNthCalledWith(2, { Marker: 'marker-1' });
    });

    it('deduplicates objects already present in the accumulator', async() => {
      const { ctx } = makeCtx();
      const shared = { InstanceType: 'm5.large' };
      const client = {
        describeInstanceTypes: jest.fn()
          .mockResolvedValueOnce({ InstanceTypes: [shared], NextToken: 'token-1' })
          .mockResolvedValueOnce({ InstanceTypes: [shared] }),
      };

      const result = await actions.depaginateList(ctx as any, {
        client, cmd: 'describeInstanceTypes', key: undefined, opt: undefined
      });

      expect(result).toStrictEqual([shared]);
    });

    it('uses the explicit key when provided instead of auto-detecting an array field', async() => {
      const { ctx } = makeCtx();
      const client = { customCmd: jest.fn().mockResolvedValue({ NotTheKey: ['x'], TheKey: [{ id: 1 }] }) };

      const result = await actions.depaginateList(ctx as any, {
        client, cmd: 'customCmd', key: 'TheKey', opt: undefined
      });

      expect(result).toStrictEqual([{ id: 1 }]);
    });

    it('passes through initial opt values on the first request', async() => {
      const { ctx } = makeCtx();
      const client = { describeInstanceTypes: jest.fn().mockResolvedValue({ InstanceTypes: [] }) };

      await actions.depaginateList(ctx as any, {
        client, cmd: 'describeInstanceTypes', key: undefined, opt: { Filters: [{ Name: 'x', Values: ['y'] }] }
      });

      expect(client.describeInstanceTypes).toHaveBeenCalledWith({ Filters: [{ Name: 'x', Values: ['y'] }] });
    });

    it('formats and re-throws errors from the client call, stopping pagination', async() => {
      const { ctx } = makeCtx();
      const err = new Error('boom');
      const client = { describeInstanceTypes: jest.fn().mockRejectedValue(err) };

      await expect(actions.depaginateList(ctx as any, {
        client, cmd: 'describeInstanceTypes', key: undefined, opt: undefined
      }))
        .rejects.toThrow('boom');
      expect(client.describeInstanceTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('describeInstanceTypes', () => {
    const makeRow = (overrides: Partial<Record<string, any>> = {}) => ({
      InstanceType:          'm5.large',
      CurrentGeneration:     true,
      MemoryInfo:            { SizeInMiB: 8192 },
      SupportedUsageClasses: ['on-demand'],
      ProcessorInfo:         { SupportedArchitectures: ['x86_64'] },
      VCpuInfo:              { DefaultVCpus: 2 },
      ...overrides,
    });

    it('returns cached rootGetters data when cloudCredentialId and region match clientInfo', async() => {
      const cachedTypes = [{ apiName: 'cached.type' }];
      const { ctx, dispatch } = makeCtx({
        rootGetters: {
          'aws/clientInfo':    { cloudCredentialId: 'cc-1', region: 'us-west-2' },
          'aws/instanceTypes': cachedTypes,
        },
      });
      const client = { config: { requestHandler: { cloudCredentialId: 'cc-1' }, region: jest.fn().mockResolvedValue('us-west-2') } };

      const result = await actions.describeInstanceTypes(ctx as any, { client });

      expect(result).toStrictEqual(cachedTypes);
      expect(dispatch).not.toHaveBeenCalledWith('depaginateList', expect.anything());
    });

    it.each([
      {
        desc:     'NVMe-supported storage',
        info:     { TotalSizeInGB: 100, NvmeSupport: 'supported' },
        expected: {
          storageSize: 100, storageUnit: 'GB', storageType: 'NVMe'
        },
      },
      {
        desc:     'SSD disk type',
        info:     { TotalSizeInGB: 100, Disks: [{ Type: 'ssd' }] },
        expected: {
          storageSize: 100, storageUnit: 'GB', storageType: 'SSD'
        },
      },
      {
        desc:     'HDD disk type',
        info:     { TotalSizeInGB: 100, Disks: [{ Type: 'hdd' }] },
        expected: {
          storageSize: 100, storageUnit: 'GB', storageType: 'HDD'
        },
      },
      {
        desc:     'unrecognized disk type',
        info:     { TotalSizeInGB: 100, Disks: [{ Type: 'other' }] },
        expected: {
          storageSize: 100, storageUnit: 'GB', storageType: 'Unknown'
        },
      },
      {
        desc:     'size over 1000GB converts to TB',
        info:     { TotalSizeInGB: 2000, NvmeSupport: 'supported' },
        expected: {
          storageSize: 2, storageUnit: 'TB', storageType: 'NVMe'
        },
      },
    ])('derives storage fields for $desc', async({ info, expected }) => {
      const { ctx, dispatch, commit } = makeCtx();
      const client = { config: { requestHandler: {}, region: jest.fn().mockResolvedValue('us-west-2') } };

      dispatch.mockResolvedValueOnce([makeRow({ InstanceStorageInfo: info })]);

      await actions.describeInstanceTypes(ctx as any, { client });

      const [{ types }] = commit.mock.calls[0].slice(1);
      const labelArgs = JSON.parse(types[0].label.replace('cluster.machineConfig.aws.sizeLabel:', ''));

      expect(labelArgs.storageSize).toStrictEqual(expected.storageSize);
      expect(labelArgs.storageUnit).toStrictEqual(expected.storageUnit);
      expect(labelArgs.storageType).toStrictEqual(expected.storageType);
    });

    it('defaults storage to 0GB and null type when no InstanceStorageInfo is present', async() => {
      const { ctx, dispatch, commit } = makeCtx();
      const client = { config: { requestHandler: {}, region: jest.fn().mockResolvedValue('us-west-2') } };

      dispatch.mockResolvedValueOnce([makeRow()]);

      await actions.describeInstanceTypes(ctx as any, { client });

      const [{ types }] = commit.mock.calls[0].slice(1);
      const labelArgs = JSON.parse(types[0].label.replace('cluster.machineConfig.aws.sizeLabel:', ''));

      expect(labelArgs.storageSize).toStrictEqual(0);
      expect(labelArgs.storageUnit).toStrictEqual('GB');
      expect(labelArgs.storageType).toStrictEqual(null);
    });

    it('maps arm64 architecture to the ARM label in the generated i18n label', async() => {
      const { ctx, dispatch, commit } = makeCtx();
      const client = { config: { requestHandler: {}, region: jest.fn().mockResolvedValue('us-west-2') } };

      dispatch.mockResolvedValueOnce([makeRow({ ProcessorInfo: { SupportedArchitectures: ['arm64'] } })]);

      await actions.describeInstanceTypes(ctx as any, { client });

      const [{ types }] = commit.mock.calls[0].slice(1);

      expect(types[0].label).toContain('"architecture":"ARM"');
    });

    it('groups by unknown instance class when not present in the ec2-instance-groups data', async() => {
      const { ctx, dispatch, commit } = makeCtx();
      const client = { config: { requestHandler: {}, region: jest.fn().mockResolvedValue('us-west-2') } };

      dispatch.mockResolvedValueOnce([makeRow({ InstanceType: 'zz9.large' })]);

      await actions.describeInstanceTypes(ctx as any, { client });

      const [{ types }] = commit.mock.calls[0].slice(1);

      expect(types[0].groupLabel).toStrictEqual('Unknown');
      expect(types[0].instanceClass).toStrictEqual('zz9');
    });

    it('sorts current-generation instances first, then by group/class/memory/name, and commits setInstanceTypes', async() => {
      const { ctx, dispatch, commit } = makeCtx();
      const client = { config: { requestHandler: { cloudCredentialId: 'cc-1' }, region: jest.fn().mockResolvedValue('us-west-2') } };

      dispatch.mockResolvedValueOnce([
        makeRow({
          InstanceType: 'm5.small', CurrentGeneration: false, MemoryInfo: { SizeInMiB: 2048 }
        }),
        makeRow({
          InstanceType: 'm5.large', CurrentGeneration: true, MemoryInfo: { SizeInMiB: 8192 }
        }),
      ]);

      const result = await actions.describeInstanceTypes(ctx as any, { client });

      expect(result.map((r: any) => r.apiName)).toStrictEqual(['m5.large', 'm5.small']);
      expect(commit).toHaveBeenCalledWith('setInstanceTypes', {
        types:      result,
        clientInfo: { region: 'us-west-2', cloudCredentialId: 'cc-1' },
      });
    });
  });
});
