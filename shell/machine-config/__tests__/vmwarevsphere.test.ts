import { mount } from '@vue/test-utils';
import vmwarevsphere, { DEFAULT_VALUES } from '@shell/machine-config/vmwarevsphere.vue';

describe('component: vmwarevsphere', () => {
  it('should mount successfully with correct default values', () => {
    const defaultGetters = { 'i18n/t': jest.fn() };
    const wrapper = mount(vmwarevsphere, {
      propsData: {
        poolId:       'poolId',
        credentialId: 'credentialId',
        disabled:     false,
        mode:         'create',
        value:        {
          initted: false,
          network: [],
          tag:     []
        },
        provider: 'vmwarevsphere'
      },
      mocks: {
        $fetchState: { pending: false },
        $store:      { getters: defaultGetters },
      },
      stubs: { CodeMirror: true }
    });

    const dataCenterElement = wrapper.find(`[data-testid="datacenter"]`).element;
    const resourcePoolElement = wrapper.find(`[data-testid="resourcePool"]`).element;
    const dataStoreElement = wrapper.find(`[data-testid="dataStore"]`).element;
    const folderElement = wrapper.find(`[data-testid="folder"]`).element;
    const hostElement = wrapper.find(`[data-testid="host"]`).element;
    const gracefulShutdownTimeoutElement = wrapper.find(`[data-testid="gracefulShutdownTimeout"]`).element;

    expect(dataCenterElement).toBeDefined();
    expect(resourcePoolElement).toBeDefined();
    expect(dataStoreElement).toBeDefined();
    expect(folderElement).toBeDefined();
    expect(hostElement).toBeDefined();
    expect(gracefulShutdownTimeoutElement).toBeDefined();

    const {
      cpuCount: defaultCpuCount,
      diskSize: defaultDiskSize,
      memorySize: defaultMemorySize,
      hostsystem: defaultHostsystem,
      cloudConfig: defaultCloudConfig,
      gracefulShutdownTimeout: defaultGracefulShutdownTimeout,
      cfgparam: defaultCfgparam,
      os: defaultOs
    } = DEFAULT_VALUES;

    const {
      cpuCount,
      diskSize,
      memorySize,
      hostsystem,
      cloudConfig,
      gracefulShutdownTimeout,
      cfgparam,
      os
    } = wrapper.vm.$options.propsData.value;

    expect(cpuCount).toStrictEqual(defaultCpuCount);
    expect(diskSize).toStrictEqual(defaultDiskSize);
    expect(memorySize).toStrictEqual(defaultMemorySize);
    expect(hostsystem).toStrictEqual(defaultHostsystem);
    expect(cloudConfig).toStrictEqual(defaultCloudConfig);
    expect(gracefulShutdownTimeout).toStrictEqual(defaultGracefulShutdownTimeout);
    expect(cfgparam).toStrictEqual(defaultCfgparam);
    expect(os).toStrictEqual(defaultOs);
  });
});
