import Harvester from '@pkg/harvester-manager/machine-config/harvester.vue';
import { HCI } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const harvester = Harvester as any;

const CLUSTER_ID = 'c-abc12';
const BASE_URL = `/k8s/clusters/${ CLUSTER_ID }/v1`;
const DEVICE_CAPACITY_URL = `${ BASE_URL }/harvester/cluster/local/deviceCapacity`;

const GPU_TYPE = 'nvidia.com/GA102GL_A10';
const NIC_TYPE = 'intel.com/82599_ETHERNET';

const mockT = (key: string) => key;

describe('component: harvester machine config - PCI devices', () => {
  describe('data', () => {
    const createData = (value: any) => harvester.data.call({
      mode:            _EDIT,
      value:           { userData: '', ...value },
      hasInstallAgent: () => false,
    });

    it('should parse existing hostDeviceInfo into hostDevices', () => {
      const hostDeviceInfo = JSON.stringify({
        hostDevices: [
          { name: 'hostdevice-1', deviceName: GPU_TYPE },
          { name: 'hostdevice-2', deviceName: NIC_TYPE },
          { name: 'hostdevice-3' },
        ]
      });

      const data = createData({ hostDeviceInfo });

      expect(data.hostDevices).toStrictEqual([GPU_TYPE, NIC_TYPE]);
      expect(data.pciDevices).toStrictEqual({});
    });

    it('should default hostDevices to an empty list when hostDeviceInfo is absent', () => {
      expect(createData({}).hostDevices).toStrictEqual([]);
    });

    it('should default hostDevices to an empty list when hostDeviceInfo has no hostDevices', () => {
      expect(createData({ hostDeviceInfo: '{}' }).hostDevices).toStrictEqual([]);
    });
  });

  describe('updateHostDevices', () => {
    it('should serialize the selected devices with sequential names', () => {
      const ctx = { hostDevices: [GPU_TYPE, '', NIC_TYPE], value: {} as any };

      harvester.methods.updateHostDevices.call(ctx);

      expect(JSON.parse(ctx.value.hostDeviceInfo)).toStrictEqual({
        hostDevices: [
          { name: 'hostdevice-1', deviceName: GPU_TYPE },
          { name: 'hostdevice-2', deviceName: NIC_TYPE },
        ]
      });
    });

    it.each([
      [[]],
      [['']],
      [undefined],
    ])('should set an empty string when no device is selected (%p)', (hostDevices) => {
      const ctx = { hostDevices, value: { hostDeviceInfo: 'stale' } as any };

      harvester.methods.updateHostDevices.call(ctx);

      expect(ctx.value.hostDeviceInfo).toBe('');
    });
  });

  describe('getAvailablePciDevices', () => {
    const pciDevices = {
      data: [
        {
          id:     'node1-000001000',
          status: {
            nodeName: 'node1', address: '0000:01:00.0', resourceName: GPU_TYPE, description: 'NVIDIA A10'
          }
        },
        {
          id:     'node2-000001000',
          status: {
            nodeName: 'node2', address: '0000:01:00.0', resourceName: GPU_TYPE, description: 'NVIDIA A10'
          }
        },
        {
          id:     'node1-000002000',
          status: {
            nodeName: 'node1', address: '0000:02:00.0', resourceName: NIC_TYPE, description: 'Intel 82599'
          }
        },
      ]
    };

    // node1's GPU is claimed; node2's GPU has a claim at a different address; node1's NIC is claimed on another node
    const pciDeviceClaims = {
      data: [
        { spec: { nodeName: 'node1', address: '0000:01:00.0' } },
        { spec: { nodeName: 'node2', address: '0000:09:00.0' } },
        { spec: { nodeName: 'node2', address: '0000:02:00.0' } },
      ]
    };

    const createCtx = ({ deviceCapacity, withCapacityLink = true }: { deviceCapacity?: any, withCapacityLink?: boolean }) => {
      const responses: Record<string, any> = {
        [`${ BASE_URL }/${ HCI.PCI_DEVICE }`]:       pciDevices,
        [`${ BASE_URL }/${ HCI.PCI_DEVICE_CLAIM }`]: pciDeviceClaims,
        [`${ BASE_URL }/harvester/cluster/local`]:   { links: withCapacityLink ? { deviceCapacity: DEVICE_CAPACITY_URL } : {} },
        [DEVICE_CAPACITY_URL]:                       deviceCapacity,
      };

      const dispatch = jest.fn((action: string, { url }: { url: string }) => {
        if (action !== 'cluster/request' || !(url in responses)) {
          return Promise.reject(new Error(`unexpected request ${ action } ${ url }`));
        }

        return Promise.resolve(responses[url]);
      });

      return {
        credential: { decodedData: { clusterId: CLUSTER_ID } },
        $store:     { dispatch },
        pciDevices: {} as Record<string, any>,
      };
    };

    it('should only enable devices that have a matching PCIDeviceClaim', async() => {
      const ctx = createCtx({ deviceCapacity: { [GPU_TYPE]: '2' } });

      await harvester.methods.getAvailablePciDevices.call(ctx);

      expect(ctx.pciDevices['node1-000001000'].enabled).toBe(true);
      expect(ctx.pciDevices['node2-000001000'].enabled).toBe(false);
      expect(ctx.pciDevices['node1-000002000'].enabled).toBe(false);
    });

    it('should map device info and allocatable from deviceCapacity', async() => {
      const ctx = createCtx({ deviceCapacity: { [GPU_TYPE]: '2' } });

      await harvester.methods.getAvailablePciDevices.call(ctx);

      expect(ctx.pciDevices['node1-000001000']).toStrictEqual({
        id:          'node1-000001000',
        enabled:     true,
        description: 'NVIDIA A10',
        allocatable: 2,
        type:        GPU_TYPE,
      });
      // type missing from deviceCapacity
      expect(ctx.pciDevices['node1-000002000'].allocatable).toBe(0);
    });

    it('should set allocatable to null when the cluster has no deviceCapacity link', async() => {
      const ctx = createCtx({ withCapacityLink: false });

      await harvester.methods.getAvailablePciDevices.call(ctx);

      expect(Object.values(ctx.pciDevices).map((d: any) => d.allocatable)).toStrictEqual([null, null, null]);
      expect(ctx.$store.dispatch).not.toHaveBeenCalledWith('cluster/request', { url: DEVICE_CAPACITY_URL });
    });

    it('should not request anything when the credential has no clusterId', async() => {
      const ctx = { ...createCtx({}), credential: null };

      await harvester.methods.getAvailablePciDevices.call(ctx);

      expect(ctx.$store.dispatch).toHaveBeenCalledTimes(0);
      expect(ctx.pciDevices).toStrictEqual({});
    });
  });

  describe('pciDeviceOptions', () => {
    const createCtx = (pciDevices: Record<string, any>, hostDevices: string[] = []) => {
      const ctx: any = {
        mode: _EDIT, t: mockT, pciDevices, hostDevices
      };

      ctx.pciDeviceOptionLabel = (opt: string) => harvester.methods.pciDeviceOptionLabel.call(ctx, opt);

      return ctx;
    };

    const values = (ctx: any) => harvester.computed.pciDeviceOptions.call(ctx).map((o: any) => o.value);

    it('should drop disabled, untyped and unallocatable devices', () => {
      const ctx = createCtx({
        a: {
          id: 'a', enabled: false, type: GPU_TYPE, allocatable: 2
        },
        b: {
          id: 'b', enabled: true, type: '', allocatable: 2
        },
        c: {
          id: 'c', enabled: true, type: NIC_TYPE, allocatable: 0
        },
      });

      expect(values(ctx)).toStrictEqual([]);
    });

    it('should keep enabled devices with unknown or positive allocatable, deduped by type', () => {
      const ctx = createCtx({
        a: {
          id: 'a', enabled: true, type: GPU_TYPE, allocatable: 2, description: 'NVIDIA A10'
        },
        b: {
          id: 'b', enabled: true, type: GPU_TYPE, allocatable: 2, description: 'NVIDIA A10'
        },
        c: {
          id: 'c', enabled: true, type: NIC_TYPE, allocatable: null
        },
      });

      expect(harvester.computed.pciDeviceOptions.call(ctx)).toStrictEqual([
        { label: `NVIDIA A10 - ${ GPU_TYPE } (harvesterManager.hostDevices.allocatable: 2)`, value: GPU_TYPE },
        { label: `${ NIC_TYPE } (harvesterManager.hostDevices.allocatableUnknown)`, value: NIC_TYPE },
      ]);
    });

    it('should keep an already selected device even when allocatable is 0', () => {
      const ctx = createCtx({
        a: {
          id: 'a', enabled: true, type: GPU_TYPE, allocatable: 0
        },
        c: {
          id: 'c', enabled: true, type: NIC_TYPE, allocatable: 0
        },
      }, [GPU_TYPE]);

      expect(values(ctx)).toStrictEqual([GPU_TYPE]);
    });
  });

  describe('pciDeviceOptionLabel', () => {
    const label = (pciDevice: any, mode = _EDIT) => harvester.methods.pciDeviceOptionLabel.call({
      mode, t: mockT, pciDevices: { a: pciDevice }
    }, GPU_TYPE);

    it('should prefix the description and suffix the allocatable count', () => {
      expect(label({
        type: GPU_TYPE, description: 'NVIDIA A10', allocatable: 3
      }))
        .toBe(`NVIDIA A10 - ${ GPU_TYPE } (harvesterManager.hostDevices.allocatable: 3)`);
    });

    it('should use the bare type when there is no description', () => {
      expect(label({
        type: GPU_TYPE, description: '', allocatable: 3
      }))
        .toBe(`${ GPU_TYPE } (harvesterManager.hostDevices.allocatable: 3)`);
    });

    it('should suffix the unknown allocation message when allocatable is null', () => {
      expect(label({
        type: GPU_TYPE, description: 'NVIDIA A10', allocatable: null
      }))
        .toBe(`NVIDIA A10 - ${ GPU_TYPE } (harvesterManager.hostDevices.allocatableUnknown)`);
    });

    it('should not add a suffix when allocatable is 0', () => {
      expect(label({
        type: GPU_TYPE, description: 'NVIDIA A10', allocatable: 0
      }))
        .toBe(`NVIDIA A10 - ${ GPU_TYPE }`);
    });

    it.each([3, null])('should not add a suffix in view mode (allocatable %p)', (allocatable) => {
      expect(label({
        type: GPU_TYPE, description: 'NVIDIA A10', allocatable
      }, _VIEW))
        .toBe(`NVIDIA A10 - ${ GPU_TYPE }`);
    });

    it('should fall back to the type when the device is unknown', () => {
      expect(harvester.methods.pciDeviceOptionLabel.call({
        mode: _EDIT, t: mockT, pciDevices: {}
      }, GPU_TYPE)).toBe(GPU_TYPE);
    });
  });

  describe('validatorHostDevices', () => {
    const pool = (quantity: number, deviceNames: string[]) => ({
      pool:   { quantity },
      config: { hostDeviceInfo: deviceNames.length ? JSON.stringify({ hostDevices: deviceNames.map((deviceName, i) => ({ name: `hostdevice-${ i + 1 }`, deviceName })) }) : '' }
    });

    const validate = ({ machinePools, allocatable, hostDevices = [GPU_TYPE] }: { machinePools: any[], allocatable: number | null, hostDevices?: string[] }) => {
      const t = jest.fn((key: string, args: any) => `${ key }-${ JSON.stringify(args) }`);
      const errors: string[] = [];

      harvester.methods.validatorHostDevices.call({
        hostDevices,
        machinePools,
        pciDevices: {
          a: {
            id: 'a', enabled: true, type: GPU_TYPE, allocatable
          }
        },
        $store: { getters: { 'i18n/t': t } },
      }, errors);

      return { errors, t };
    };

    it('should push notAllocatable when pools request more devices than allocatable', () => {
      const { errors, t } = validate({
        machinePools: [pool(2, [GPU_TYPE]), pool(1, [GPU_TYPE, NIC_TYPE]), pool(5, [NIC_TYPE]), pool(4, [])],
        allocatable:  2,
      });

      expect(errors).toHaveLength(1);
      expect(t).toHaveBeenCalledWith('cluster.credential.harvester.hostDevices.errors.notAllocatable', {
        hostDevice: GPU_TYPE, allocated: 3, allocatable: 2
      });
    });

    it('should not push an error when requests fit within allocatable', () => {
      const { errors } = validate({ machinePools: [pool(1, [GPU_TYPE]), pool(1, [GPU_TYPE])], allocatable: 2 });

      expect(errors).toStrictEqual([]);
    });

    it.each([0, null])('should not push an error when allocatable is %p', (allocatable) => {
      const { errors } = validate({ machinePools: [pool(3, [GPU_TYPE])], allocatable });

      expect(errors).toStrictEqual([]);
    });

    it('should not push an error when no device is selected', () => {
      const { errors } = validate({
        machinePools: [pool(3, [GPU_TYPE])], allocatable: 1, hostDevices: []
      });

      expect(errors).toStrictEqual([]);
    });
  });
});
