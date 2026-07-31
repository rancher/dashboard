import { shallowMount } from '@vue/test-utils';
import FleetApplicationCreate from '@shell/pages/c/_cluster/fleet/application/create.vue';
import { FLEET } from '@shell/config/types';
import { isRancherPrime } from '@shell/config/version';

jest.mock('@shell/config/version', () => ({ isRancherPrime: jest.fn(() => true) }));

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

const createStore = (appCollectionSettingValue?: string) => ({
  getters: {
    'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
    'type-map/labelFor':    () => 'Helm Op',
    'management/byId':      (_type: string, _id: string) => (appCollectionSettingValue !== undefined ? { value: appCollectionSettingValue } : undefined),
    'prefs/theme':          'light',
    'i18n/t':               (key: string) => key,
    'i18n/exists':          () => false,
    productId:              'fleet',
  },
});

const createWrapper = () => shallowMount(FleetApplicationCreate);

describe('page: fleet/application/create', () => {
  beforeEach(() => {
    (isRancherPrime as jest.Mock).mockReturnValue(true);
  });

  it('should show the SUSE Application Collection subtype when the setting is absent (default enabled)', () => {
    mockStore = createStore();

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(true);
  });

  it('should show the SUSE Application Collection subtype when the setting is enabled', () => {
    mockStore = createStore('true');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(true);
  });

  it('should hide the SUSE Application Collection subtype when the setting is disabled', () => {
    mockStore = createStore('false');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(false);
  });

  it('should still show the other subtypes when the SUSE Application Collection setting is disabled', () => {
    mockStore = createStore('false');

    const wrapper = createWrapper();

    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.GIT_REPO }"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="subtype-banner-item-${ FLEET.HELM_OP }"]`).exists()).toBe(true);
  });

  it('should hide the SUSE Application Collection subtype when not running Rancher Prime, even if the setting is enabled', () => {
    (isRancherPrime as jest.Mock).mockReturnValue(false);
    mockStore = createStore('true');

    const wrapper = createWrapper();

    expect(wrapper.find(SUSE_APP_CO_TESTID).exists()).toBe(false);
  });
});
