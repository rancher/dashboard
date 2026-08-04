import { shallowMount } from '@vue/test-utils';
import EditWorkspace from '@shell/edit/management.cattle.io.fleetworkspace.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';

describe('edit: management.cattle.io.fleetworkspace', () => {
  const mockValue = {
    metadata: { name: 'fleet-default', annotations: {} },
    spec:     {},
    save:     jest.fn(),
  };

  const store = {
    dispatch: jest.fn(() => Promise.resolve([])),
    commit:   jest.fn(),
    getters:  {
      'i18n/t':               (key: string) => key,
      'i18n/exists':          () => true,
      'management/schemaFor': () => null,
      'type-map/optionsFor':  () => ({}),
      'prefs/get':            () => undefined,
      currentProduct:         { name: FLEET_NAME },
    },
    state: { allWorkspaces: [], workspace: 'fleet-default' },
  };

  const createWrapper = () => shallowMount(EditWorkspace, {
    props:  { value: mockValue, mode: 'create' },
    global: {
      mocks: {
        $store: store, $route: { params: {} }, $router: { push: jest.fn() }, $fetchState: { pending: false }
      },
      renderStubDefaultSlot: true,
    },
  });

  beforeEach(() => jest.clearAllMocks());

  it('renders the GitRepoRestriction deprecation banner on the allowed target namespaces tab', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="fleet-workspace-restriction-deprecation-banner"]').exists()).toBe(true);
  });

  it('renders a "learn more" migration link on the allowed target namespaces tab', () => {
    const wrapper = createWrapper();

    // URL resolution is covered by fleet-docs.test.ts; here we assert the link renders.
    expect(wrapper.find('[data-testid="fleet-workspace-restriction-learn-more"]').exists()).toBe(true);
  });
});
