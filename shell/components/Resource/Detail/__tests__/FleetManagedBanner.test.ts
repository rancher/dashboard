import { mount, RouterLinkStub } from '@vue/test-utils';
import { createStore } from 'vuex';
import FleetManagedBanner from '@shell/components/Resource/Detail/FleetManagedBanner.vue';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { FLEET } from '@shell/config/types';

interface StoreOptions {
  fleetEnabled?: boolean;
  listable?: string[];
  workspaces?: string[];
}

const createMockStore = ({
  fleetEnabled = true,
  listable = [FLEET.GIT_REPO, FLEET.HELM_OP, FLEET.BUNDLE, FLEET.WORKSPACE],
  workspaces = ['fleet-default'],
}: StoreOptions = {}) => createStore({
  getters: {
    'i18n/t':             () => (key: string) => (key === 'product.fleet' ? 'Continuous Delivery' : key),
    'features/get':       () => () => fleetEnabled,
    'management/canList': () => (type: string) => listable.includes(type),
    'management/all':     () => (type: string) => (type === FLEET.WORKSPACE ? workspaces : []).map((id) => ({ id })),
  }
});

const fleetResource = (kind = 'gitrepo', workspace = 'fleet-default', name = 'my-source') => ({
  metadata: {
    labels: {
      [FLEET_LABELS.MANAGED_BY_KIND]:      kind,
      [FLEET_LABELS.MANAGED_BY_NAMESPACE]: workspace,
      [FLEET_LABELS.MANAGED_BY_NAME]:      name,
    }
  }
});

const createWrapper = (resource?: object, storeOptions?: StoreOptions) => mount(FleetManagedBanner, {
  props:  { resource },
  global: {
    plugins: [createMockStore(storeOptions)],
    stubs:   { 'router-link': RouterLinkStub },
  }
});

const findBanner = (wrapper: ReturnType<typeof createWrapper>) => wrapper.find('[data-testid="fleet-managed-banner"]');
const findLink = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findComponent(RouterLinkStub);

describe('component: FleetManagedBanner', () => {
  describe('banner', () => {
    it.each([
      ['gitrepo'],
      ['helmop'],
      ['bundle'],
    ])('should render when the resource is managed by a Fleet %p', (kind) => {
      const wrapper = createWrapper(fleetResource(kind));

      expect(findBanner(wrapper).exists()).toBe(true);
      expect(findBanner(wrapper).text()).toContain('resourceDetail.masthead.fleetManaged');
    });

    it('should name the product in the banner text', () => {
      const wrapper = createWrapper(fleetResource());

      expect(wrapper.find('[k="resourceDetail.masthead.fleetManaged"]').attributes('name')).toStrictEqual('Continuous Delivery');
    });

    it.each([
      ['no resource', undefined],
      ['no metadata', {}],
      ['no labels', { metadata: {} }],
      ['only unrelated labels', { metadata: { labels: { [FLEET_LABELS.MANAGED]: 'true', 'app.kubernetes.io/managed-by': 'Helm' } } }],
    ])('should not render when the resource has %s', (_, resource) => {
      const wrapper = createWrapper(resource);

      expect(findBanner(wrapper).exists()).toBe(false);
    });
  });

  describe('link to the Fleet source', () => {
    it.each([
      ['gitrepo', FLEET.GIT_REPO],
      ['helmop', FLEET.HELM_OP],
    ])('should link a %p to its Fleet application page', (kind, type) => {
      const wrapper = createWrapper(fleetResource(kind));

      expect(findLink(wrapper).props('to')).toStrictEqual({
        name:   'c-cluster-fleet-application-resource-namespace-id',
        params: {
          cluster: '_', resource: type, namespace: 'fleet-default', id: 'my-source'
        }
      });
    });

    it('should link a bundle to its Fleet resource page', () => {
      const wrapper = createWrapper(fleetResource('bundle'));

      expect(findLink(wrapper).props('to')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster: '_', product: 'fleet', resource: FLEET.BUNDLE, namespace: 'fleet-default', id: 'my-source'
        }
      });
    });

    it.each([
      ['the Fleet feature is disabled', { fleetEnabled: false }],
      ['the user cannot list the source type', { listable: [FLEET.HELM_OP, FLEET.WORKSPACE] }],
      ['the workspace is not one of the user workspaces', { workspaces: ['fleet-local'] }],
      ['the user cannot list workspaces', { listable: [FLEET.GIT_REPO] }],
    ])('should not link when %s', (_, storeOptions) => {
      const wrapper = createWrapper(fleetResource(), storeOptions);

      expect(findBanner(wrapper).exists()).toBe(true);
      expect(findLink(wrapper).exists()).toBe(false);
    });

    it.each([
      ['an unknown kind', fleetResource('unknown')],
      ['no workspace label', { metadata: { labels: { [FLEET_LABELS.MANAGED_BY_KIND]: 'gitrepo', [FLEET_LABELS.MANAGED_BY_NAME]: 'my-source' } } }],
      ['no name label', { metadata: { labels: { [FLEET_LABELS.MANAGED_BY_KIND]: 'gitrepo', [FLEET_LABELS.MANAGED_BY_NAMESPACE]: 'fleet-default' } } }],
    ])('should not link when the resource has %s', (_, resource) => {
      const wrapper = createWrapper(resource);

      expect(findBanner(wrapper).exists()).toBe(true);
      expect(findLink(wrapper).exists()).toBe(false);
    });
  });
});
