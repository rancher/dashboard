import { mount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import GitRepo from '@shell/edit/fleet.cattle.io.gitrepo.vue';

const values = {
  metadata: { namespace: 'test' },
  spec:     {
    template:     {},
    correctDrift: { enabled: false },
  },
  targetInfo: { mode: 'all' },
};

describe('view: fleet.cattle.io.gitrepo should', () => {
  const mockStore = {
    dispatch: jest.fn(),
    getters:  {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      workspace:                 jest.fn(),
    }
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
  const wrapper = mount(GitRepo, {
    props:  { value: values, mode: _EDIT },
    global: { mocks }
  });

  it('have self-healing checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"]');
    const tooltip = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"]');

    expect(tooltip.element.classList).toContain('v-popper--has-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('have keep-resources checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="GitRepo-keepResources-checkbox"]');
    const tooltip = wrapper.find('[data-testid="GitRepo-keepResources-checkbox"]');

    expect(tooltip.element.classList).toContain('v-popper--has-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('enable drift if self-healing is checked', async() => {
    const correctDriftCheckbox = wrapper.findComponent('[data-testid="GitRepo-correctDrift-checkbox"]');
    const correctDriftContainer = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"] .checkbox-container');

    expect(correctDriftContainer.exists()).toBeTruthy();

    await correctDriftContainer.trigger('click');

    expect(correctDriftCheckbox.emitted('update:value')).toHaveLength(1);
    expect(correctDriftCheckbox.emitted('update:value')![0][0]).toBe(true);
    expect(correctDriftCheckbox.props().value).toBeTruthy();
  });

  it.each([
    ['show Polling Interval', 'enabled', undefined, true],
    ['show Polling Interval', 'enabled', false, true],
    ['hide Polling Interval', 'disabled', true, false],
  ])('show Enable Polling checkbox and %p if %p, with spec.disablePolling: %p', (
    showPollingIntervalMessage,
    enabledMessage,
    disablePolling,
    enabled
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: {
            disablePolling,
            pollingInterval: 60
          }
        },
        mode: _EDIT
      },
      global: { mocks },
    });

    const pollingCheckbox = wrapper.findComponent('[data-testid="GitRepo-enablePolling-checkbox"]') as any;
    const pollingIntervalInput = wrapper.find('[data-testid="GitRepo-pollingInterval-input"]');

    expect(pollingCheckbox.exists()).toBeTruthy();
    expect(pollingCheckbox.vm.value).toBe(enabled);
    expect(pollingIntervalInput.exists()).toBe(enabled);
  });

  it.each([
    ['null', 'default 60 seconds', null, '60'],
    ['0', 'default 60 seconds', 0, '60'],
    ['1', 'custom 1 second', 1, '1'],
    ['60', 'custom 60 seconds', 60, '60'],
    ['20', 'custom 15 seconds', 15, '15'],
  ])('show Polling Interval input with source: %p, value: %p', async(
    source,
    actual,
    pollingInterval,
    unitValue,
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: { pollingInterval }
        },
        mode: _EDIT
      },
      global: { mocks },
    });

    const pollingIntervalInput = wrapper.find('[data-testid="GitRepo-pollingInterval-input"]').element as any;

    expect(pollingIntervalInput).toBeDefined();
    expect(pollingIntervalInput.value).toBe(unitValue);
  });

  it.each([
    ['hide', 'source: null, value: equal to 60', null, false],
    ['hide', 'source: 0, value: equal to 60', 0, false],
    ['hide', 'source: 15, value: equal to 15', 15, false],
    ['hide', 'source: 60, value: equal to 60', 60, false],
    ['hide', 'source: 16, value: higher than 15', 16, false],
    ['show', 'source: 1, value: lower than 15', 1, true],
  ])('%p Polling Interval warning if %p', async(
    status,
    condition,
    pollingInterval,
    visible,
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: { pollingInterval }
        },
        mode: _EDIT
      },
      global: { mocks },
    });

    const pollingIntervalWarning = wrapper.find('[data-testid="GitRepo-pollingInterval-warning"]');

    expect(pollingIntervalWarning.exists()).toBe(visible);
  });
});
