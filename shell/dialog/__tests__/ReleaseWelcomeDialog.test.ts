import { shallowMount } from '@vue/test-utils';
import ReleaseWelcomeDialog from '@shell/dialog/ReleaseWelcomeDialog.vue';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import PrimeRegistrationCard from '@shell/components/ReleaseWelcome/PrimeRegistrationCard.vue';
import WhatsNewCard from '@shell/components/ReleaseWelcome/WhatsNewCard.vue';
import { setVersionData } from '@shell/config/version';
import { REGISTRATION_ROUTE } from '@shell/config/release-welcome';
import { SCC } from '@shell/store/features';

let mockStore: any;

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const RouterLinkStub = {
  name: 'RouterLink', props: ['to'], template: '<a><slot /></a>'
};

const createStore = ({ admin = true, scc = true } = {}): any => ({
  getters: {
    'management/schemaFor': () => ({ resourceMethods: admin ? ['PUT'] : ['GET'] }),
    'features/get':         (feature: string) => (feature === SCC ? scc : false),
  },
});

const createWrapper = ({
  prime = false, admin = true, scc = true, features = undefined as any[] | undefined
} = {}) => {
  setVersionData({
    Version: 'v2.16.1', RancherPrime: prime ? 'true' : 'false', GitCommit: ''
  });
  mockStore = createStore({ admin, scc });

  return shallowMount(ReleaseWelcomeDialog, {
    props:  { features },
    global: {
      mocks: { t: (key: string) => key },
      stubs: { 'router-link': RouterLinkStub }
    }
  });
};

const byTestId = (wrapper: any, id: string) => wrapper.find(`[data-testid="${ id }"]`);

describe('component: ReleaseWelcomeDialog', () => {
  afterEach(() => {
    setVersionData({
      Version: '', RancherPrime: 'false', GitCommit: ''
    });
  });

  it.each([
    [false, 'releaseWelcome.titleCommunity'],
    [true, 'releaseWelcome.titlePrime'],
  ])('should welcome Prime %p with the title %p', (prime, title) => {
    const wrapper = createWrapper({ prime });

    expect(wrapper.find('h2').text()).toStrictEqual(title);
  });

  it('should mark the title as the dialog name', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h2').attributes('data-modal-title')).toBeDefined();
  });

  it('should pass the minor version to the what\'s new card', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(WhatsNewCard).props('version')).toStrictEqual('2.16');
  });

  it('should pass the features from dynamic content to the what\'s new card', () => {
    const features = [{
      id: 'remote', title: 'Remote title', description: 'Remote description'
    }];
    const wrapper = createWrapper({ features });

    expect(wrapper.findComponent(WhatsNewCard).props('features')).toStrictEqual(features);
  });

  it('should leave the built-in features to the what\'s new card without dynamic content', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(WhatsNewCard).props('features')).toBeUndefined();
  });

  describe('community', () => {
    it('should promote Prime', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(PrimePromoCard).exists()).toStrictEqual(true);
    });

    it('should not show the registration card', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(false);
    });

    it('should not link the registration page', () => {
      const wrapper = createWrapper();

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(false);
    });
  });

  describe('prime', () => {
    it('should not promote Prime', () => {
      const wrapper = createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimePromoCard).exists()).toStrictEqual(false);
    });

    it('should show the registration card to admins', () => {
      const wrapper = createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(true);
    });

    it('should link the registration page for admins', () => {
      const wrapper = createWrapper({ prime: true });

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(true);
    });

    it.each([
      ['a user who is not admin', { admin: false, scc: true }],
      ['the SCC feature disabled', { admin: true, scc: false }],
    ])('should not show the registration card to %s', (_, access) => {
      const wrapper = createWrapper({ prime: true, ...access });

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(false);
    });

    it.each([
      ['a user who is not admin', { admin: false, scc: true }],
      ['the SCC feature disabled', { admin: true, scc: false }],
    ])('should not link the registration page for %s', (_, access) => {
      const wrapper = createWrapper({ prime: true, ...access });

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(false);
    });

    it('should link the registration page route', () => {
      const wrapper = createWrapper({ prime: true });

      expect(wrapper.findComponent(RouterLinkStub).props('to')).toStrictEqual(REGISTRATION_ROUTE);
    });

    it('should close when the registration page link is followed', async() => {
      const wrapper = createWrapper({ prime: true });

      await byTestId(wrapper, 'release-welcome-registration-page').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  it.each([
    ['release-welcome-close'],
    ['release-welcome-go-to-dashboard'],
  ])('should close on %p', async(testId) => {
    const wrapper = createWrapper();

    await byTestId(wrapper, testId).trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
