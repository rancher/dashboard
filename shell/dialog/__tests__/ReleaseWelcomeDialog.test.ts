import { flushPromises, shallowMount } from '@vue/test-utils';
import ReleaseWelcomeDialog from '@shell/dialog/ReleaseWelcomeDialog.vue';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import PrimeRegistrationCard from '@shell/components/ReleaseWelcome/PrimeRegistrationCard.vue';
import WhatsNewCard from '@shell/components/ReleaseWelcome/WhatsNewCard.vue';
import { setVersionData } from '@shell/config/version';
import { REGISTRATION_ROUTE } from '@shell/config/release-welcome';
import { SCC } from '@shell/store/features';
import { fetchFirstRunContent } from '@shell/utils/dynamic-content/first-run';

let mockStore: any;

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('@shell/utils/dynamic-content/first-run', () => ({ fetchFirstRunContent: jest.fn() }));

const mockFetchFirstRunContent = fetchFirstRunContent as jest.Mock;

const RouterLinkStub = {
  name: 'RouterLink', props: ['to'], template: '<a><slot /></a>'
};

// Renders the body and the actions, its attributes land on the root like on the dialog element
const RcModalStub = {
  name: 'RcModal', props: ['show', 'size'], template: '<div><slot /><slot name="actions" /></div>'
};

const PROMO = {
  title: 'Go Prime', description: 'Remote promotion', products: ['Remote product'], cta: { action: 'Explore', link: 'https://www.suse.com' }
};
const REGISTRATION = {
  title: 'Register', description: 'Remote card', benefits: [{ text: 'Remote benefit' }], cta: { action: 'Open', link: 'https://scc.suse.com' }
};
const FEATURES = [{
  id: 'remote', title: 'Remote title', description: 'Remote description'
}];

const createStore = ({ admin = true, scc = true } = {}): any => ({
  $axios:  jest.fn(),
  getters: {
    'management/schemaFor': () => ({ resourceMethods: admin ? ['PUT'] : ['GET'] }),
    'features/get':         (feature: string) => (feature === SCC ? scc : false),
  },
});

const mount = ({
  prime = false, admin = true, scc = true, version = 'v2.16.1'
} = {}) => {
  setVersionData({
    Version: version, RancherPrime: prime ? 'true' : 'false', GitCommit: ''
  });
  mockStore = createStore({ admin, scc });

  return shallowMount(ReleaseWelcomeDialog, {
    props:  { modal: { show: true, onClose: jest.fn() } },
    global: {
      mocks: { t: (key: string, args?: any) => (args?.version ? `${ key } ${ args.version }` : key) },
      stubs: { 'router-link': RouterLinkStub, RcModal: RcModalStub }
    }
  });
};

// Mounted, with the dynamic content loaded
const createWrapper = async(options = {}) => {
  const wrapper = mount(options);

  await flushPromises();

  return wrapper;
};

const byTestId = (wrapper: any, id: string) => wrapper.find(`[data-testid="${ id }"]`);

describe('component: ReleaseWelcomeDialog', () => {
  beforeEach(() => {
    mockFetchFirstRunContent.mockReset();
    mockFetchFirstRunContent.mockResolvedValue({});
  });

  afterEach(() => {
    setVersionData({
      Version: '', RancherPrime: 'false', GitCommit: ''
    });
  });

  it.each([
    [false],
    [true],
  ])('should welcome the vendor, Prime %p', async(prime) => {
    const wrapper = await createWrapper({ prime });

    expect(byTestId(wrapper, 'release-welcome-title').text()).toStrictEqual('releaseWelcome.title');
  });

  it('should name the modal after its title', async() => {
    const wrapper = await createWrapper();

    expect(wrapper.findComponent(RcModalStub).attributes('aria-label')).toStrictEqual('releaseWelcome.title');
  });

  it('should open the modal from the ModalManager state', async() => {
    const wrapper = await createWrapper();

    expect(wrapper.findComponent(RcModalStub).props('show')).toStrictEqual(true);
  });

  it.each([
    [false],
    [true],
  ])('should name the running patch version in the subtitle, Prime %p', async(prime) => {
    const wrapper = await createWrapper({ prime });

    expect(byTestId(wrapper, 'release-welcome-subtitle').text()).toContain('2.16.1');
  });

  describe('loading', () => {
    it('should show the spinner while the dynamic content loads', () => {
      mockFetchFirstRunContent.mockReturnValue(new Promise(() => {}));
      const wrapper = mount();

      expect(byTestId(wrapper, 'release-welcome-loading').exists()).toStrictEqual(true);
    });

    it('should not show the cards while the dynamic content loads', () => {
      mockFetchFirstRunContent.mockReturnValue(new Promise(() => {}));
      const wrapper = mount();

      expect(wrapper.findComponent(WhatsNewCard).exists()).toStrictEqual(false);
    });

    it('should show the cards once the dynamic content is loaded', async() => {
      const wrapper = await createWrapper();

      expect(byTestId(wrapper, 'release-welcome-loading').exists()).toStrictEqual(false);
      expect(wrapper.findComponent(WhatsNewCard).exists()).toStrictEqual(true);
    });

    it('should fetch the dynamic content for the running minor version', async() => {
      await createWrapper();

      expect(mockFetchFirstRunContent).toHaveBeenCalledWith(mockStore.getters, mockStore.$axios, '2.16');
    });

    it('should show the built-in content without fetching when the version cannot be parsed', async() => {
      const wrapper = await createWrapper({ version: 'dev' });

      expect(mockFetchFirstRunContent).toHaveBeenCalledTimes(0);
      expect(wrapper.findComponent(WhatsNewCard).exists()).toStrictEqual(true);
    });
  });

  it('should pass the minor version to the what\'s new card', async() => {
    const wrapper = await createWrapper();

    expect(wrapper.findComponent(WhatsNewCard).props('version')).toStrictEqual('2.16');
  });

  it('should pass the features from dynamic content to the what\'s new card', async() => {
    mockFetchFirstRunContent.mockResolvedValue({ features: FEATURES });
    const wrapper = await createWrapper();

    expect(wrapper.findComponent(WhatsNewCard).props('features')).toStrictEqual(FEATURES);
  });

  it('should leave the built-in features to the what\'s new card without dynamic content', async() => {
    const wrapper = await createWrapper();

    expect(wrapper.findComponent(WhatsNewCard).props('features')).toBeUndefined();
  });

  describe('community', () => {
    it('should promote Prime', async() => {
      const wrapper = await createWrapper();

      expect(wrapper.findComponent(PrimePromoCard).exists()).toStrictEqual(true);
    });

    it('should pass the promotion from dynamic content to the Prime card', async() => {
      mockFetchFirstRunContent.mockResolvedValue({ primePromo: PROMO });
      const wrapper = await createWrapper();

      expect(wrapper.findComponent(PrimePromoCard).props('promo')).toStrictEqual(PROMO);
    });

    it('should leave the built-in promotion to the Prime card without dynamic content', async() => {
      const wrapper = await createWrapper();

      expect(wrapper.findComponent(PrimePromoCard).props('promo')).toBeUndefined();
    });

    it('should not show the registration card', async() => {
      const wrapper = await createWrapper();

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(false);
    });

    it('should not link the registration page', async() => {
      const wrapper = await createWrapper();

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(false);
    });
  });

  describe('prime', () => {
    it('should not promote Prime', async() => {
      const wrapper = await createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimePromoCard).exists()).toStrictEqual(false);
    });

    it('should show the registration card to admins', async() => {
      const wrapper = await createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(true);
    });

    it('should pass the registration card from dynamic content', async() => {
      mockFetchFirstRunContent.mockResolvedValue({ registration: REGISTRATION });
      const wrapper = await createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimeRegistrationCard).props('registration')).toStrictEqual(REGISTRATION);
    });

    it('should leave the built-in registration card without dynamic content', async() => {
      const wrapper = await createWrapper({ prime: true });

      expect(wrapper.findComponent(PrimeRegistrationCard).props('registration')).toBeUndefined();
    });

    it('should link the registration page for admins', async() => {
      const wrapper = await createWrapper({ prime: true });

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(true);
    });

    it.each([
      ['a user who is not admin', { admin: false, scc: true }],
      ['the SCC feature disabled', { admin: true, scc: false }],
    ])('should not show the registration card to %s', async(_, access) => {
      const wrapper = await createWrapper({ prime: true, ...access });

      expect(wrapper.findComponent(PrimeRegistrationCard).exists()).toStrictEqual(false);
    });

    it.each([
      ['a user who is not admin', { admin: false, scc: true }],
      ['the SCC feature disabled', { admin: true, scc: false }],
    ])('should not link the registration page for %s', async(_, access) => {
      const wrapper = await createWrapper({ prime: true, ...access });

      expect(byTestId(wrapper, 'release-welcome-registration-page').exists()).toStrictEqual(false);
    });

    it('should link the registration page route', async() => {
      const wrapper = await createWrapper({ prime: true });

      expect(wrapper.findComponent(RouterLinkStub).props('to')).toStrictEqual(REGISTRATION_ROUTE);
    });

    it('should close when the registration page link is followed', async() => {
      const wrapper = await createWrapper({ prime: true });

      await byTestId(wrapper, 'release-welcome-registration-page').trigger('click');

      expect(wrapper.props('modal').onClose).toHaveBeenCalledWith();
    });
  });

  it.each([
    ['release-welcome-close'],
    ['release-welcome-go-to-dashboard'],
  ])('should close on %p', async(testId) => {
    const wrapper = await createWrapper();

    await byTestId(wrapper, testId).trigger('click');

    expect(wrapper.props('modal').onClose).toHaveBeenCalledWith();
  });
});
