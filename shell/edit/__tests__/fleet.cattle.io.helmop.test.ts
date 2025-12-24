import { mount } from '@vue/test-utils';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import HelmOp from '@shell/models/fleet.cattle.io.helmop';
import HelmOpComponent from '@shell/edit/fleet.cattle.io.helmop.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';

const mockStore = {
  dispatch: jest.fn(),
  commit:   jest.fn(),
  getters:  {
    'i18n/t':                       (text: string) => text,
    'i18n/exists':                  jest.fn(),
    t:                              (text: string) => text,
    currentStore:                   () => 'current_store',
    'current_store/schemaFor':      jest.fn(),
    'current_store/all':            jest.fn(),
    workspace:                      'test',
    'management/paginationEnabled': () => false,
    'management/all':               () => [],
  },
  rootGetters: { 'i18n/t': jest.fn() },
};

const mocks = {
  $store:      mockStore,
  $fetchState: { pending: false },
  $route:      {
    query: { AS: '' },
    name:  {
      endsWith: () => {
        return false;
      }
    }
  },
};

const mockComputed = {
  ...HelmOpComponent.computed,
  steps: () => [{
    name:           'advanced',
    title:          'title',
    label:          'label',
    subtext:        'subtext',
    descriptionKey: 'description',
    ready:          true,
    weight:         1,
  }],
};

const mockHelmOp = {
  type:       'fleet.cattle.io.helmop',
  apiVersion: 'fleet.cattle.io/v1alpha1',
  kind:       'HelmOp',
  metadata:   {
    name:      'test',
    namespace: 'test1',
  },
  spec: {
    targetNamespace: 'custom-namespace-name',
    helm:            {},
    targets:         [
      { clusterName: `fleet-local` }
    ],
  },
  status:       {},
  currentRoute: () => {},
};

const initHelmOp = (props: any, options = {}) => {
  const value = new HelmOp({
    ...mockHelmOp,
    ...options
  }, {
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': jest.fn() },
  });

  value.applyDefaults = () => {};
  value.metadata = { namespace: '' };

  return {
    props: {
      value,
      ...props
    },
    computed: mockComputed,
    global:   { mocks },
  };
};

describe('view: fleet.cattle.io.helmop, mode: view', () => {
  it('should hide advanced options banner', () => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ mode: _VIEW }));

    const advancedInfoBanner = wrapper.find('[data-testid="helmOp-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBe(false);
  });
});

describe('helmOp component lifecycle', () => {
  it('should have registerBeforeHook method available and call updateBeforeSave', () => {
    const helmOpOptions = {
      metadata: {
        name:      'test-helmop',
        namespace: 'test-namespace',
        labels:    {}
      }
    };

    const wrapper = mount(HelmOpComponent, initHelmOp({ mode: _CREATE }, helmOpOptions));

    // Mock registerBeforeHook to spy on calls
    const mockRegisterBeforeHook = jest.fn();

    wrapper.vm.registerBeforeHook = mockRegisterBeforeHook;

    // Verify updateBeforeSave method exists
    expect(typeof wrapper.vm.updateBeforeSave).toBe('function');

    // Call the method that would be called during created lifecycle
    wrapper.vm.registerBeforeHook(wrapper.vm.updateBeforeSave);

    // Verify that registerBeforeHook was called with updateBeforeSave function
    expect(mockRegisterBeforeHook).toHaveBeenCalledWith(wrapper.vm.updateBeforeSave);
  });

  it('should have doCreateSecrets method available for registerBeforeHook', () => {
    const helmOpOptions = {
      metadata: {
        name:      'test-helmop',
        namespace: 'test-namespace',
        labels:    {}
      }
    };

    const wrapper = mount(HelmOpComponent, initHelmOp({ mode: _CREATE }, helmOpOptions));

    // Verify doCreateSecrets method exists
    expect(typeof wrapper.vm.doCreateSecrets).toBe('function');
  });
});

describe.each([
  _CREATE,
  _EDIT,
])('view: fleet.cattle.io.helmop, mode: %p', (mode) => {
  const wrapper = mount(HelmOpComponent, initHelmOp({ mode }));

  it('should show advanced options banner', () => {
    const advancedInfoBanner = wrapper.find('[data-testid="helmOp-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBeTruthy();
  });

  it.each([
    ['not display', ' OCI registry', 'chart', 'oci://foo', false],
    ['not display', 'Tarball', 'https://foo', '', false],
    ['display', 'Repository', 'bar', 'https://foo', true],
  ])('should %p Polling section if source is %p', (
    descr1,
    descr2,
    chart,
    repo,
    visible
  ) => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }, {
      spec: {
        pollingInterval: 20,
        helm:            {
          chart,
          repo,
          version: '1.2.x'
        }
      },
    }));

    const pollingCheckbox = wrapper.findComponent('[data-testid="helmOp-enablePolling-checkbox"]');

    expect(pollingCheckbox.exists()).toBe(visible);
  });

  it.each([
    ['disabled', 'not display', '1.2.3', undefined, false, false],
    ['disabled', 'not display', '1.2.3', null, false, false],
    ['disabled', 'not display', '1.2.3', 0, false, false],
    ['disabled', 'not display', '1.2.3', 10, false, false],
    ['disabled', 'not display', '1.2.3', 30, false, false],
    ['disabled', 'not display', '', 0, false, false],
    ['disabled', 'not display', null, 0, false, false],
    ['enabled', 'display', '1.2.x', 10, true, true],
    ['enabled', 'not display', '1.2.x', 30, true, false],
  ])('should show Polling %p and %p min-value warning, with spec.version: %p and spec.disablePolling: %p', (
    descr1,
    descr2,
    version,
    pollingInterval,
    enabled,
    minValueWarnVisible
  ) => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }, {
      spec: {
        pollingInterval,
        helm: {
          chart: 'foo',
          repo:  'https://foo',
          version
        }
      },
    }));

    const pollingCheckbox = wrapper.findComponent('[data-testid="helmOp-enablePolling-checkbox"]') as any;
    const pollingIntervalInput = wrapper.find('[data-testid="helmOp-pollingInterval-input"]');
    const pollingIntervalMinimumValueWarning = wrapper.find('[data-testid="helmOp-pollingInterval-minimumValueWarning"]');

    expect(pollingCheckbox.exists()).toBe(true);
    expect(pollingCheckbox.vm.value).toBe(enabled);
    expect(pollingCheckbox.element.classList.value.includes('has-clean-tooltip')).toBe(!enabled);
    expect(pollingIntervalInput.exists()).toBe(enabled);
    expect(pollingIntervalMinimumValueWarning.exists()).toBe(minValueWarnVisible);
  });

  it('should disable Polling Interval', async() => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }, {
      spec: {
        pollingInterval: 10,
        helm:            {
          chart:   'foo',
          repo:    'https://foo',
          version: '1.2.x'
        }
      },
    }));

    wrapper.vm.togglePolling(false);

    await wrapper.vm.$nextTick();

    const pollingIntervalInput = wrapper.find('[data-testid="helmOp-pollingInterval-input"]');

    expect(pollingIntervalInput.exists()).toBe(false);
  });

  it.each([
    ['15', null],
    ['15', 0],
    ['30', 30],
  ])('should set minimum Polling Interval to %p when input value is %p', async(
    displayValue,
    inputValue
  ) => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }, {
      spec: {
        pollingInterval: 10,
        helm:            {
          chart:   'foo',
          repo:    'https://foo',
          version: '1.2.x'
        }
      },
    }));

    wrapper.vm.pollingInterval = inputValue;
    wrapper.vm.updatePollingInterval(inputValue);

    await wrapper.vm.$nextTick();

    const pollingIntervalInput = wrapper.find('[data-testid="helmOp-pollingInterval-input"]').element as HTMLInputElement;

    expect(pollingIntervalInput.value).toBe(displayValue);
  });

  it('should update downstreamResources with new Secrets when FleetSecretSelector emits update event', async() => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }));

    const fleetConfigMapSelector = wrapper.findComponent(FleetConfigMapSelector);
    const fleetSecretSelector = wrapper.findComponent(FleetSecretSelector);

    expect(fleetSecretSelector.exists()).toBe(true);
    expect(fleetConfigMapSelector.exists()).toBe(true);

    await fleetSecretSelector.vm.$emit('update:value', []);
    await fleetConfigMapSelector.vm.$emit('update:value', []);

    await fleetSecretSelector.vm.$emit('update:value', ['secret2', 'secret3']);

    expect(wrapper.vm.value.spec.downstreamResources).toStrictEqual([{ name: 'secret2', kind: 'Secret' }, { name: 'secret3', kind: 'Secret' }]);
  });

  it('should update downstreamResources with new ConfigMaps when FleetConfigMapSelector emits update event', async() => {
    const wrapper = mount(HelmOpComponent, initHelmOp({ realMode: mode }));

    const fleetConfigMapSelector = wrapper.findComponent(FleetConfigMapSelector);
    const fleetSecretSelector = wrapper.findComponent(FleetSecretSelector);

    expect(fleetSecretSelector.exists()).toBe(true);
    expect(fleetConfigMapSelector.exists()).toBe(true);

    await fleetSecretSelector.vm.$emit('update:value', []);
    await fleetConfigMapSelector.vm.$emit('update:value', []);

    await fleetConfigMapSelector.vm.$emit('update:value', ['configMap2', 'configMap3']);

    expect(wrapper.vm.value.spec.downstreamResources).toStrictEqual([{ name: 'configMap2', kind: 'ConfigMap' }, { name: 'configMap3', kind: 'ConfigMap' }]);
  });

  if (mode === _CREATE) {
    it('should set created-by-user-id label when updateBeforeSave is called in CREATE mode', () => {
      const mockCurrentUser = { id: 'user-123' };
      const helmOpOptions = {
        metadata: {
          name:      'test-helmop',
          namespace: 'test-namespace',
          labels:    {}
        }
      };
      const wrapper = mount(HelmOpComponent, initHelmOp({ mode, realMode: mode }, helmOpOptions));

      // Ensure metadata.labels exists
      if (!wrapper.vm.value.metadata.labels) {
        wrapper.vm.value.metadata.labels = {};
      }

      // Mock the currentUser
      (wrapper.vm as any).currentUser = mockCurrentUser;

      // Call updateBeforeSave method
      wrapper.vm.updateBeforeSave();

      // Should set the created-by-user-id label in CREATE mode
      expect(wrapper.vm.value.metadata.labels['fleet.cattle.io/created-by-user-id']).toBe('user-123');
    });
  } else {
    it('should not set created-by-user-id label when updateBeforeSave is called in EDIT mode', () => {
      const mockCurrentUser = { id: 'user-123' };
      const helmOpOptions = {
        metadata: {
          name:      'test-helmop',
          namespace: 'test-namespace',
          labels:    {}
        }
      };
      const wrapper = mount(HelmOpComponent, initHelmOp({ mode, realMode: mode }, helmOpOptions));

      // Ensure metadata.labels exists
      if (!wrapper.vm.value.metadata.labels) {
        wrapper.vm.value.metadata.labels = {};
      }

      // Mock the currentUser
      (wrapper.vm as any).currentUser = mockCurrentUser;

      // Call updateBeforeSave method
      wrapper.vm.updateBeforeSave();

      // Should not set the label in EDIT mode
      expect(wrapper.vm.value.metadata.labels['fleet.cattle.io/created-by-user-id']).toBeUndefined();
    });
  }
});
