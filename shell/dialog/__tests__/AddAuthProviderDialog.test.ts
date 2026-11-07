import { mount } from '@vue/test-utils';
import AddAuthProviderDialog from '@shell/dialog/AddAuthProviderDialog.vue';
import { RcItemCard } from '@components/RcItemCard';
import { RcTag } from '@components/Pill';

const rows = [
  {
    id: 'okta', configTypeName: 'oktaConfig', name: 'Okta', categoryLabel: 'SAML', category: 'saml', icon: 'okta.svg'
  },
  {
    id: 'github', configTypeName: 'githubConfig', name: 'GitHub', categoryLabel: 'OAuth', category: 'oauth', icon: 'github.svg'
  },
  {
    id: 'openldap', configTypeName: 'openLdapConfig', name: 'OpenLDAP', categoryLabel: 'LDAP', category: 'ldap', icon: ''
  },
];

// How long the dialog lets a search settle before it announces the result
const ANNOUNCE_DELAY = 500;

const createWrapper = (props = {}) => mount(AddAuthProviderDialog, {
  props: {
    rows, selectCb: jest.fn(), modal: { show: true, onClose: jest.fn() }, ...props
  },
  attachTo: document.body,
  global:   { stubs: { teleport: true } },
});

const tileNames = (wrapper: any) => wrapper
  .findAllComponents(RcItemCard)
  .map((card: any) => card.props('header').title.text);

const protocolTag = (wrapper: any, id: string) => wrapper
  .findAllComponents(RcTag)
  .find((tag: any) => tag.attributes('data-testid') === `add-auth-provider-tile-protocol-${ id }`);

describe('component: AddAuthProviderDialog', () => {
  // How many providers can be enabled at once decides what adding one means
  it.each([
    ['Community', { prime: false, multipleAllowed: false }, 'authConfig.add.subtitle'],
    ['Prime with Multiple Auth Providers on', { prime: true, multipleAllowed: true }, 'authConfig.add.subtitleMultiple'],
    ['Prime with Multiple Auth Providers off', { prime: true, multipleAllowed: false }, 'authConfig.add.subtitlePrimeSingle'],
  ])('should explain the provider limit for %s', (_, props, expected) => {
    expect(createWrapper(props).find('.add-auth-provider__subtitle').text()).toBe(expected);
  });

  it('should offer every provider type it is given', () => {
    expect(tileNames(createWrapper())).toStrictEqual(['Okta', 'GitHub', 'OpenLDAP']);
  });

  it('should render each provider type as a Rancher Components card', () => {
    const wrapper = createWrapper();

    expect(wrapper.findAllComponents(RcItemCard)).toHaveLength(3);
  });

  it.each([
    ['okta', 'SAML'],
    ['github', 'OAuth'],
    ['openldap', 'LDAP'],
  ])('should tag the %s card with its protocol', (id, categoryLabel) => {
    expect(protocolTag(createWrapper(), id).text()).toBe(categoryLabel);
  });

  it('should render the protocol tag as inactive', () => {
    expect(protocolTag(createWrapper(), 'okta').props('type')).toBe('inactive');
  });

  it('should render the protocol tag in the card sub-header rather than as card content', () => {
    const card = createWrapper().findComponent(RcItemCard);

    expect(card.props('content')).toBeUndefined();
  });

  it('should narrow the grid by search term', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-search"]').setValue('git');

    expect(tileNames(wrapper)).toStrictEqual(['GitHub']);
  });

  it('should match the search term regardless of case', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-search"]').setValue('OKTA');

    expect(tileNames(wrapper)).toStrictEqual(['Okta']);
  });

  it('should narrow the grid by protocol', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-filter-saml"]').trigger('click');

    expect(tileNames(wrapper)).toStrictEqual(['Okta']);
  });

  it('should return to the full grid via the All filter', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-filter-saml"]').trigger('click');
    await wrapper.find('[data-testid="add-auth-provider-filter-all"]').trigger('click');

    expect(tileNames(wrapper)).toHaveLength(3);
  });

  // A filter that can only ever empty the grid is worse than no filter.
  it('should only offer protocols that are represented', () => {
    const wrapper = createWrapper({ rows: [rows[0]] });

    expect(wrapper.find('[data-testid="add-auth-provider-filter-saml"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="add-auth-provider-filter-oauth"]').exists()).toBe(false);
  });

  describe('marking the filter in effect', () => {
    const filter = (wrapper: any, name: string) => wrapper.find(`[data-testid="add-auth-provider-filter-${ name }"]`);

    it('should start with All in effect', () => {
      const wrapper = createWrapper();

      expect(filter(wrapper, 'all').attributes('aria-pressed')).toBe('true');
      expect(filter(wrapper, 'saml').attributes('aria-pressed')).toBe('false');
    });

    it('should move the pressed state to the chosen protocol', async() => {
      const wrapper = createWrapper();

      await filter(wrapper, 'saml').trigger('click');

      expect(filter(wrapper, 'saml').attributes('aria-pressed')).toBe('true');
      expect(filter(wrapper, 'all').attributes('aria-pressed')).toBe('false');
      expect(filter(wrapper, 'oauth').attributes('aria-pressed')).toBe('false');
    });

    // The pills only mean something under the 'Protocol' label beside them
    it('should group the filters under their label', () => {
      const wrapper = createWrapper();
      const group = wrapper.find('[role="group"]');
      const label = wrapper.find('.add-auth-provider__filter-label');

      expect(group.attributes('aria-labelledby')).toBe(label.attributes('id'));
      expect(label.attributes('id')).toBeTruthy();
    });
  });

  it.each([
    ['saml', 'SAML'],
    ['oauth', 'OAuth'],
    ['ldap', 'LDAP'],
  ])('should name the %s filter as the cards name it', (configType, sideLabel) => {
    const filter = createWrapper().find(`[data-testid="add-auth-provider-filter-${ configType }"]`);

    expect(filter.text()).toBe(sideLabel);
  });

  it('should say so when nothing matches', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-search"]').setValue('nothing');

    expect(tileNames(wrapper)).toStrictEqual([]);
    expect(wrapper.find('[data-testid="add-auth-provider-no-results"]').exists()).toBe(true);
  });

  describe('announcing results', () => {
    const announcement = (wrapper: any) => wrapper.find('[data-testid="add-auth-provider-announcement"]');

    const searchFor = async(wrapper: any, term: string) => {
      await wrapper.find('[data-testid="add-auth-provider-search"]').setValue(term);
      jest.advanceTimersByTime(ANNOUNCE_DELAY);
      await wrapper.vm.$nextTick();
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('should keep a live region for the result of a search', () => {
      expect(announcement(createWrapper()).attributes('aria-live')).toBe('polite');
    });

    // Opening the dialog is not a search, so there is no result to report yet.
    it('should stay silent until something is searched for', () => {
      expect(announcement(createWrapper()).text()).toBe('');
    });

    it('should announce how many providers a search found', async() => {
      const wrapper = createWrapper();

      await searchFor(wrapper, 'git');

      expect(announcement(wrapper).text()).toBe('authConfig.add.resultCount-{"count":1}');
    });

    it('should announce when a search found nothing', async() => {
      const wrapper = createWrapper();

      await searchFor(wrapper, 'nothing');

      expect(announcement(wrapper).text()).toBe('authConfig.add.noResults');
    });

    it('should announce a narrowed protocol', async() => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="add-auth-provider-filter-saml"]').trigger('click');
      jest.advanceTimersByTime(ANNOUNCE_DELAY);
      await wrapper.vm.$nextTick();

      expect(announcement(wrapper).text()).toBe('authConfig.add.resultCount-{"count":1}');
    });

    // Every letter of a typed word narrows the grid, and a live region reads
    // each change it sees - so it should only see where the typing settled.
    it('should announce only the result the typing settled on', async() => {
      const wrapper = createWrapper();
      const search = wrapper.find('[data-testid="add-auth-provider-search"]');

      await search.setValue('g');
      await search.setValue('gi');
      jest.advanceTimersByTime(ANNOUNCE_DELAY - 1);
      await wrapper.vm.$nextTick();

      expect(announcement(wrapper).text()).toBe('');

      await searchFor(wrapper, 'git');

      expect(announcement(wrapper).text()).toBe('authConfig.add.resultCount-{"count":1}');
    });
  });

  it('should report the chosen type and close', async() => {
    const selectCb = jest.fn();
    const wrapper = createWrapper({ selectCb });

    await wrapper.find('[data-testid="add-auth-provider-tile-github"]').trigger('click');

    expect(selectCb).toHaveBeenCalledWith('github');
    expect(wrapper.props('modal').onClose).toHaveBeenCalledWith();
  });

  it('should close without choosing when cancelled', async() => {
    const selectCb = jest.fn();
    const wrapper = createWrapper({ selectCb });

    await wrapper.find('[data-testid="add-auth-provider-cancel"]').trigger('click');

    expect(selectCb).not.toHaveBeenCalled();
    expect(wrapper.props('modal').onClose).toHaveBeenCalledWith();
  });
});
