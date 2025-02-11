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
    ['null', 'default 15 seconds', null, '15'],
    ['0', 'default 15 seconds', 0, '15'],
    ['1', 'min 15 seconds', 1, '1'],
    ['15', 'custom 15 seconds', 15, '15'],
    ['20', 'custom 20 seconds', 20, '20'],
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
    ['hide', 'source: null, value: equal to 15', null, false],
    ['hide', 'source: 0, value: equal to 15', 0, false],
    ['hide', 'source: 15, value: equal to 15', 15, false],
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
