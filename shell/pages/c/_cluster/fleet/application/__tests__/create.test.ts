import { shallowMount } from '@vue/test-utils';
import FleetApplicationCreate from '@shell/pages/c/_cluster/fleet/application/create.vue';
import { FLEET } from '@shell/config/types';

jest.mock('@shell/config/version', () => ({ isRancherPrime: jest.fn(() => true) }));

// `@shell/config/version` is untyped JS, so a named `isRancherPrime` import trips a (baselined) TS2305;
// pull the mock from requireMock (cast) to control it while keeping this new file type-clean.
const { isRancherPrime } = jest.requireMock('@shell/config/version') as { isRancherPrime: jest.Mock };

// Masthead pulls in a heavy dependency chain (ActionMenu -> LabeledSelect) that requires a full store.
// We shallowMount and only care about the subtype cards, so stub it out.
jest.mock('@shell/components/ResourceDetail/Masthead', () => ({
  __esModule: true,
  default:    { name: 'Masthead', template: '<div />' },
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock('vue-router', () => ({
  useRoute:  () => ({ params: { cluster: 'local' }, query: {} }),
  useRouter: () => mockRouter,
}));

let mockStore: any;

jest.mock('vuex', () => ({ useStore: () => mockStore }));

const SUSE_APP_CO_TESTID = `[data-testid="subtype-banner-item-${ FLEET.SUSE_APP_COLLECTION }"]`;

// `systemCatalogValue` is the value of the `system-catalog` setting: `bundle` = airgap / bundled charts
// only, which hides the SUSE Application Collection integration.
const createStore = (systemCatalogValue?: string) => ({
  getters: {
    'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
    'type-map/labelFor':    () => 'Helm Op',
    'management/byId':      (_type: string, _id: string) => (systemCatalogValue !== undefined ? { value: systemCatalogValue } : undefined),
    'prefs/theme':          'light',
    'i18n/t':               (key: string) => key,
    'i18n/exists':          () => false,
    productId:              'fleet',
  },
});

const createWrapper = () => shallowMount(FleetApplicationCreate);

describe('page: fleet/application/create', () => {
  beforeEach(() => {
    isRancherPrime.mockReturnValue(true);
  });

  it('should show the SUSE Application Collection subtype when the system-catalog setting is absent', () => {
    mockStore = createStore();

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(true);
  });

  it('should show the SUSE Application Collection subtype when system-catalog is not bundle', () => {
    mockStore = createStore('external');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(true);
  });

  it('should hide the SUSE Application Collection subtype when system-catalog is bundle', () => {
    mockStore = createStore('bundle');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(false);
  });

  it('should still show the other subtypes when system-catalog is bundle', () => {
    mockStore = createStore('bundle');

    const wrapper = createWrapper();

    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.GIT_REPO }"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.HELM_OP }"]`).exists()).toBe(true);
  });

  it('should hide the SUSE Application Collection subtype when not running Rancher Prime, even if system-catalog is not bundle', () => {
    isRancherPrime.mockReturnValue(false);
    mockStore = createStore('external');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(false);
  });
});
