import { mount } from '@vue/test-utils';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import HelmOp from '@shell/models/fleet.cattle.io.helmop';
import HelmOpComponent from '@shell/edit/fleet.cattle.io.helmop.vue';

const mockStore = {
  dispatch: jest.fn(),
  commit:   jest.fn(),
  getters:  {
    'i18n/t':                  (text: string) => text,
    'i18n/exists':             jest.fn(),
    t:                         (text: string) => text,
    currentStore:              () => 'current_store',
    'current_store/schemaFor': jest.fn(),
    'current_store/all':       jest.fn(),
    workspace:                 'test',
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

const initHelmOp = (props: any, value?: any) => {
  const initValue = new HelmOp({
    ...mockHelmOp,
    ...(value || {})
  }, {
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': jest.fn() },
  });

  return {
    props: {
      value: initValue,
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
    expect(pollingCheckbox.element.classList.value.includes('v-popper--has-tooltip')).toBe(!enabled);
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
});
