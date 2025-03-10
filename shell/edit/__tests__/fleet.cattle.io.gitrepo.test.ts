import { mount } from '@vue/test-utils';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import GitRepo from '@shell/edit/fleet.cattle.io.gitrepo.vue';

const mockStore = {
  dispatch: jest.fn(),
  getters:  {
    'i18n/t':                  (text: string) => text,
    'i18n/exists':             jest.fn(),
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
const mockComputed = {
  ...GitRepo.computed,
  steps: () => [{
    name:           'stepAdvanced',
    title:          'title',
    label:          'label',
    subtext:        'subtext',
    descriptionKey: 'description',
    ready:          true,
    weight:         1,
  }],
};

const values = {
  metadata: { namespace: 'test' },
  spec:     {
    template:     {},
    correctDrift: { enabled: false },
  },
  targetInfo: { mode: 'all' },
};

describe('view: fleet.cattle.io.gitrepo, mode: view - should', () => {
  it('hide advanced options banner', () => {
    const wrapper = mount(GitRepo, {
      props:    { value: values, mode: _VIEW },
      computed: mockComputed,
      global:   { mocks }
    });

    const advancedInfoBanner = wrapper.find('[data-testid="gitrepo-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBeFalsy();
  });
});

describe.each([
  _CREATE,
  _EDIT,
])('view: fleet.cattle.io.gitrepo, mode: %p - should', (mode) => {
  const wrapper = mount(GitRepo, {
    props:    { value: values, mode },
    computed: mockComputed,
    global:   { mocks }
  });

  it('show advanced options banner', () => {
    const advancedInfoBanner = wrapper.find('[data-testid="gitrepo-advanced-info"]');

    expect(advancedInfoBanner.exists()).toBeTruthy();
  });

  it('have self-healing checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"]');
    const tooltip = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"]');

    expect(tooltip.element.classList).toContain('v-popper--has-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('have keep-resources checkbox and tooltip', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="gitRepo-keepResources-checkbox"]');
    const tooltip = wrapper.find('[data-testid="gitRepo-keepResources-checkbox"]');

    expect(tooltip.element.classList).toContain('v-popper--has-tooltip');
    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftCheckbox.attributes().value).toBeFalsy();
  });

  it('enable drift if self-healing is checked', async() => {
    const correctDriftCheckbox = wrapper.findComponent('[data-testid="gitRepo-correctDrift-checkbox"]') as any;
    const correctDriftContainer = wrapper.find('[data-testid="gitRepo-correctDrift-checkbox"] .checkbox-container');

    expect(correctDriftContainer.exists()).toBeTruthy();

    await correctDriftContainer.trigger('click');

    expect(correctDriftCheckbox.emitted('update:value')).toHaveLength(1);
    expect(correctDriftCheckbox.emitted('update:value')![0][0]).toBe(true);
    expect(correctDriftCheckbox.props().value).toBeTruthy();
  });

  it.each([
    ['show Polling Interval and warnings', 'enabled', undefined, true],
    ['show Polling Interval and warnings', 'enabled', false, true],
    ['hide Polling Interval and warnings', 'disabled', true, false],
  ])('show Enable Polling checkbox and %p if %p, with spec.disablePolling: %p', (
    descr1,
    descr2,
    disablePolling,
    enabled
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: {
            disablePolling,
            pollingInterval: 10
          },
          status: { webhookCommit: 'sha' },
        },
        realMode: mode
      },
      computed: mockComputed,
      global:   { mocks },
    });

    const pollingCheckbox = wrapper.findComponent('[data-testid="gitRepo-enablePolling-checkbox"]') as any;
    const pollingIntervalInput = wrapper.find('[data-testid="gitRepo-pollingInterval-input"]');
    const pollingIntervalMinimumValueWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-minimumValueWarning"]');
    const pollingIntervalWebhookWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-webhookWarning"]');

    expect(pollingIntervalMinimumValueWarning.exists()).toBe(enabled);
    expect(pollingIntervalWebhookWarning.exists()).toBe(enabled);
    expect(pollingCheckbox.exists()).toBeTruthy();
    expect(pollingCheckbox.vm.value).toBe(enabled);
    expect(pollingIntervalInput.exists()).toBe(enabled);
  });

  const defaultPollingInterval = mode === _CREATE ? '60' : '15';

  it.each([
    ['null', `default ${ defaultPollingInterval } seconds`, null, defaultPollingInterval],
    ['0', `default ${ defaultPollingInterval } seconds`, 0, defaultPollingInterval],
    ['1', 'custom 1 second', 1, '1'],
    ['60', 'custom 60 seconds', 60, '60'],
    ['15', 'custom 15 seconds', 15, '15'],
    ['0s', `default ${ defaultPollingInterval } seconds`, 0, defaultPollingInterval],
    ['1s', 'custom 1 second', '1s', '1'],
    ['60s', 'custom 60 seconds', '1m', '60'],
    ['1m3s', 'custom 63 seconds', '1m3s', '63'],
    ['1h2m3s', 'custom 3723 seconds', '1h2m3s', '3723'],
    ['15', 'custom 15 seconds', '15s', '15'],
  ])('show Polling Interval input with source: %p, value: %p', async(
    descr1,
    descr2,
    pollingInterval,
    unitValue,
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: { pollingInterval }
        },
        realMode: mode
      },
      computed: mockComputed,
      global:   { mocks },
    });

    const pollingIntervalInput = wrapper.find('[data-testid="gitRepo-pollingInterval-input"]').element as any;

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
    descr1,
    descr2,
    pollingInterval,
    visible,
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec: { pollingInterval }
        },
        realMode: mode
      },
      computed: mockComputed,
      global:   { mocks },
    });

    const pollingIntervalMinimumValueWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-minimumValueWarning"]');

    expect(pollingIntervalMinimumValueWarning.exists()).toBe(visible);
  });

  it.each([
    ['hide', 'disabled', null, false],
    ['hide', 'disabled', false, false],
    ['hide', 'disabled', '', false],
    ['show', 'enabled', 'sha', true],
  ])('%p Webhook configured warning if webhook is %p', (
    descr1,
    descr2,
    webhookCommit,
    visible
  ) => {
    const wrapper = mount(GitRepo, {
      props: {
        value: {
          ...values,
          spec:   { pollingInterval: 60 },
          status: { webhookCommit },
        },
        realMode: mode
      },
      computed: mockComputed,
      global:   { mocks },
    });

    const pollingIntervalWebhookWarning = wrapper.find('[data-testid="gitRepo-pollingInterval-webhookWarning"]');

    expect(pollingIntervalWebhookWarning.exists()).toBe(visible);
  });
});
