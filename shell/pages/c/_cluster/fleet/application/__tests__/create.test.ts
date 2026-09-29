import { shallowMount } from '@vue/test-utils';
import FleetApplicationCreate from '@shell/pages/c/_cluster/fleet/application/create.vue';
import { FLEET } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

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

// `settings` maps setting ids (`ui-appco-enabled`, `system-catalog`) to their values; absent ids resolve to undefined.
const createStore = (settings: Record<string, string> = {}) => ({
  getters: {
    'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
    'type-map/labelFor':    () => 'Helm Op',
    'management/byId':      (_type: string, id: string) => (settings[id] !== undefined ? { value: settings[id] } : undefined),
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

  it('should show the SUSE Application Collection subtype when no setting is present', () => {
    mockStore = createStore();

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(true);
  });

  it.each([
    ['', 'external', true],
    ['', 'bundled', false],
    ['true', 'bundled', true],
    ['false', 'external', false],
  ])('should reflect the settings (ui-appco-enabled: %p, system-catalog: %p)', (appCoEnabled, systemCatalog, expected) => {
    mockStore = createStore({ [SETTING.UI_APPCO_ENABLED]: appCoEnabled, [SETTING.SYSTEM_CATALOG]: systemCatalog });

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(expected);
  });

  it('should still show the other subtypes when the SUSE Application Collection is disabled', () => {
    mockStore = createStore({ [SETTING.UI_APPCO_ENABLED]: 'false' });

    const wrapper = createWrapper();

    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.GIT_REPO }"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.HELM_OP }"]`).exists()).toBe(true);
  });

  it('should hide the SUSE Application Collection subtype when not running Rancher Prime, even if ui-appco-enabled is true', () => {
    isRancherPrime.mockReturnValue(false);
    mockStore = createStore({ [SETTING.UI_APPCO_ENABLED]: 'true' });

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(false);
  });
});
