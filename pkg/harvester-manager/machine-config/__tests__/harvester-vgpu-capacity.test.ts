import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import Harvester from '@pkg/harvester-manager/machine-config/harvester.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { HCI } from '@shell/config/types';

const vGpuType = 'nvidia.com/NVIDIA_A2-4Q';
const baseUrl = '/k8s/clusters/harvester/v1';
const devicesUrl = `${ baseUrl }/${ HCI.VGPU_DEVICE }`;
const clusterUrl = `${ baseUrl }/harvester/cluster/local`;
const capacityUrl = `${ clusterUrl }/devicecapacity`;

interface VGpuDevice {
  id: string;
  enabled: boolean;
  type: string;
  allocatable: number | null;
}

interface HarvesterInstance {
  credential: { decodedData: { clusterId: string } } | null;
  getAvailableVGpuDevices(): Promise<void>;
  validatorVGpus(errors: string[]): void;
  vGpuDevices: Record<string, VGpuDevice>;
}

const deviceResponse = {
  data: [{
    id:   'device',
    spec: { enabled: true, vGPUTypeName: 'NVIDIA A2-4Q' }
  }]
};

function createWrapper(props: Record<string, unknown> = {}) {
  const dispatch = jest.fn().mockImplementation((_action: string, { url }: { url: string }) => {
    switch (url) {
    case devicesUrl:
      return Promise.resolve(deviceResponse);
    case clusterUrl:
      return Promise.resolve({ links: { deviceCapacity: capacityUrl } });
    case capacityUrl:
      return Promise.resolve({ [vGpuType]: 1 });
    default:
      throw new Error(`Unexpected request: ${ url }`);
    }
  });
  const vgpuInfo = JSON.stringify({ vGPURequests: [{ deviceName: vGpuType }] });
  const wrapper = shallowMount(Harvester, {
    props: {
      mode:                _EDIT,
      credentialId:        'credential',
      uuid:                'pool',
      poolIndex:           0,
      poolCreateMode:      false,
      cluster:             { spec: { kubernetesVersion: 'v1.35.2+rke2r1' } },
      previousKubeVersion: 'v1.35.1+rke2r1',
      machinePools:        [{ pool: { quantity: 3 }, config: { vgpuInfo } }],
      value:               { vgpuInfo, userData: '' },
      ...props
    },
    global: {
      mocks: {
        $fetchState: { pending: true },
        $store:      { dispatch, getters: { 'i18n/t': (key: string) => key } }
      }
    }
  });

  const vm = wrapper.vm as HarvesterInstance;

  vm.credential = { decodedData: { clusterId: 'harvester' } };

  return {
    wrapper, dispatch, vm
  };
}

describe('Harvester vGPU capacity during Kubernetes version changes', () => {
  it.each(['rke2r1', 'k3s1'])('skips device capacity for an existing %s cluster version change', async(distro) => {
    const { wrapper, vm, dispatch } = createWrapper({
      cluster:             { spec: { kubernetesVersion: `v1.35.2+${ distro }` } },
      previousKubeVersion: `v1.35.1+${ distro }`
    });

    await vm.getAvailableVGpuDevices();

    expect(dispatch.mock.calls).toStrictEqual([['cluster/request', { url: devicesUrl }]]);
    expect(vm.vGpuDevices.device.allocatable).toBeNull();
    wrapper.unmount();
  });

  it.each([
    ['creating a cluster', { mode: _CREATE }],
    ['adding a new pool', { poolCreateMode: true }],
    ['editing without a version change', { previousKubeVersion: 'v1.35.2+rke2r1' }],
    ['editing without a saved version', { previousKubeVersion: null }],
    ['editing without a selected version', { cluster: { spec: {} } }]
  ])('retains capacity requests when %s', async(_name, props) => {
    const { wrapper, vm, dispatch } = createWrapper(props);

    await vm.getAvailableVGpuDevices();

    expect(dispatch).toHaveBeenCalledWith('cluster/request', { url: capacityUrl });
    expect(vm.vGpuDevices.device.allocatable).toBe(1);
    wrapper.unmount();
  });

  it('clears stale capacity and bypasses validation when the version changes', async() => {
    const { wrapper, vm, dispatch } = createWrapper({ previousKubeVersion: 'v1.35.2+rke2r1' });

    await vm.getAvailableVGpuDevices();
    dispatch.mockClear();
    await wrapper.setProps({ cluster: { spec: { kubernetesVersion: 'v1.35.3+rke2r1' } } });
    const errors: string[] = [];

    vm.validatorVGpus(errors);

    expect(vm.vGpuDevices.device.allocatable).toBeNull();
    expect(errors).toStrictEqual([]);
    expect(dispatch.mock.calls).toStrictEqual([]);
    wrapper.unmount();
  });

  it('restores capacity requests and validation when the version is reverted', async() => {
    const { wrapper, vm, dispatch } = createWrapper();

    await vm.getAvailableVGpuDevices();
    dispatch.mockClear();
    await wrapper.setProps({ cluster: { spec: { kubernetesVersion: 'v1.35.1+rke2r1' } } });
    await flushPromises();
    const errors: string[] = [];

    vm.validatorVGpus(errors);

    expect(dispatch).toHaveBeenCalledWith('cluster/request', { url: capacityUrl });
    expect(vm.vGpuDevices.device.allocatable).toBe(1);
    expect(errors).toStrictEqual(['cluster.credential.harvester.vGpus.errors.notAllocatable']);
    wrapper.unmount();
  });

  it('ignores in-flight capacity results if the version changes before they arrive', async() => {
    const { wrapper, vm, dispatch } = createWrapper({ previousKubeVersion: 'v1.35.2+rke2r1' });
    let resolveCapacity!: (capacity: Record<string, number>) => void;
    const capacity = new Promise<Record<string, number>>((resolve) => {
      resolveCapacity = resolve;
    });

    dispatch.mockImplementation((_action: string, { url }: { url: string }) => {
      switch (url) {
      case devicesUrl:
        return Promise.resolve(deviceResponse);
      case clusterUrl:
        return Promise.resolve({ links: { deviceCapacity: capacityUrl } });
      case capacityUrl:
        return capacity;
      default:
        throw new Error(`Unexpected request: ${ url }`);
      }
    });

    const request = vm.getAvailableVGpuDevices();

    await flushPromises();
    await wrapper.setProps({ cluster: { spec: { kubernetesVersion: 'v1.35.3+rke2r1' } } });
    resolveCapacity({ [vGpuType]: 1 });
    await request;

    expect(vm.vGpuDevices.device.allocatable).toBeNull();
    wrapper.unmount();
  });
});
