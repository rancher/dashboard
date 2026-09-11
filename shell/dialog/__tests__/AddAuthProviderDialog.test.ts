import { mount } from '@vue/test-utils';
import AddAuthProviderDialog from '@shell/dialog/AddAuthProviderDialog.vue';
import { RcItemCard } from '@components/RcItemCard';
import { RcTag } from '@components/Pill';

const rows = [
  {
    id: 'okta', provider: 'Okta', sideLabel: 'SAML', configType: 'saml', icon: 'okta.svg'
  },
  {
    id: 'github', provider: 'GitHub', sideLabel: 'OAuth', configType: 'oauth', icon: 'github.svg'
  },
  {
    id: 'openldap', provider: 'OpenLDAP', sideLabel: 'LDAP', configType: 'ldap', icon: ''
  },
];

const createWrapper = (props = {}) => mount(AddAuthProviderDialog, {
  props: {
    rows, selectCb: jest.fn(), ...props
  }
});

const tileNames = (wrapper: any) => wrapper
  .findAllComponents(RcItemCard)
  .map((card: any) => card.props('header').title.text);

const protocolTag = (wrapper: any, id: string) => wrapper
  .findAllComponents(RcTag)
  .find((tag: any) => tag.attributes('data-testid') === `add-auth-provider-tile-protocol-${ id }`);

describe('component: AddAuthProviderDialog', () => {
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
  ])('should tag the %s card with its protocol', (id, sideLabel) => {
    expect(protocolTag(createWrapper(), id).text()).toBe(sideLabel);
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

  it('should say so when nothing matches', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="add-auth-provider-search"]').setValue('nothing');

    expect(tileNames(wrapper)).toStrictEqual([]);
    expect(wrapper.find('[data-testid="add-auth-provider-no-results"]').exists()).toBe(true);
  });

  it('should report the chosen type and close', async() => {
    const selectCb = jest.fn();
    const wrapper = createWrapper({ selectCb });

    await wrapper.find('[data-testid="add-auth-provider-tile-github"]').trigger('click');

    expect(selectCb).toHaveBeenCalledWith('github');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should close without choosing when cancelled', async() => {
    const selectCb = jest.fn();
    const wrapper = createWrapper({ selectCb });

    await wrapper.find('button.variant-link').trigger('click');

    expect(selectCb).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
