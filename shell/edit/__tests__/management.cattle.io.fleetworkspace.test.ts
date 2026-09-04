import { shallowMount } from '@vue/test-utils';
import EditWorkspace from '@shell/edit/management.cattle.io.fleetworkspace.vue';
import FleetMigrationGuideLink from '@shell/components/fleet/FleetMigrationGuideLink.vue';
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
    const banner = wrapper.find('[data-testid="fleet-workspace-restriction-deprecation-banner"]');

    expect(banner.exists()).toBe(true);
    // The i18n mock returns the key, so this pins the banner to the target-namespaces specific copy.
    expect(banner.text()).toContain('fleet.gitRepoRestriction.deprecationWarningTargetNamespaces');
  });

  it('links the migration guide from the deprecation banner', () => {
    const link = createWrapper().findComponent(FleetMigrationGuideLink);

    expect(link.exists()).toBe(true);
    expect(link.attributes('data-testid')).toStrictEqual('fleet-workspace-restriction-learn-more');
  });
});
