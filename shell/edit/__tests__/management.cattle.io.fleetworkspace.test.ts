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

  // Render RichTranslation's #docsLink slot (shallowMount would otherwise leave it unrendered) so the
  // migration-guide anchor and its :href binding are actually exercised.
  const richTranslationStub = { template: `<div><slot name="docsLink" :content="'guide'" /></div>` };

  const createWrapper = () => shallowMount(EditWorkspace, {
    props:  { value: mockValue, mode: 'create' },
    global: {
      mocks: {
        $store: store, $route: { params: {} }, $router: { push: jest.fn() }, $fetchState: { pending: false }
      },
      renderStubDefaultSlot: true,
      stubs:                 { RichTranslation: richTranslationStub },
    },
  });

  beforeEach(() => jest.clearAllMocks());

  it('renders the GitRepoRestriction deprecation banner on the allowed target namespaces tab', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="fleet-workspace-restriction-deprecation-banner"]').exists()).toBe(true);
  });

  it('links the migration guide to the version-aware migration docs', () => {
    const link = createWrapper().find('.migration-guide-link');

    expect(link.exists()).toBe(true);
    // getGitRepoRestrictionMigrationDocsUrl resolves to the fallback path in tests.
    expect(link.attributes('href')).toContain('how-tos-for-operators/tenant-setup');
  });
});
