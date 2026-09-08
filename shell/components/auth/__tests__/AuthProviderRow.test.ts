import { mount, RouterLinkStub } from '@vue/test-utils';
import AuthProviderRow from '@shell/components/auth/AuthProviderRow.vue';
import AuthProviderLogo from '@shell/components/auth/AuthProviderLogo.vue';
import { RcStatusBadge, RcTag } from '@components/Pill';

const mockPush = jest.fn();

jest.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }));

type Props = InstanceType<typeof AuthProviderRow>['$props'];

const createWrapper = (props: Props) => mount(AuthProviderRow, {
  props,
  global: { stubs: { 'router-link': RouterLinkStub } }
});

describe('component: AuthProviderRow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should lead with the name the admin gave the config', () => {
    const wrapper = createWrapper({
      title:       'okta-corp',
      description: 'Partners and contractors.',
      meta:        'okta-corp'
    });

    expect(wrapper.find('.auth-provider-row__title').text()).toBe('okta-corp');
    expect(wrapper.find('.auth-provider-row__description').text()).toBe('Partners and contractors.');
    expect(wrapper.find('.auth-provider-row__meta').text()).toBe('okta-corp');
  });

  // Neither the description nor the meta line is guaranteed for a given config.
  it.each([
    ['description', '.auth-provider-row__description'],
    ['meta', '.auth-provider-row__meta'],
  ])('should close the gap when the config has no %s', (prop, selector) => {
    const wrapper = createWrapper({ title: 'okta-corp', [prop]: '' });

    expect(wrapper.find(selector).exists()).toBe(false);
    expect(wrapper.find('.auth-provider-row__title').text()).toBe('okta-corp');
  });

  it('should classify the row with a tag per chip', () => {
    const wrapper = createWrapper({ title: 'okta-corp', chips: ['SAML', 'Default at login'] });

    const tags = wrapper.findAllComponents(RcTag);

    expect(tags).toHaveLength(2);
    expect(tags[0].text()).toBe('SAML');
    expect(tags[1].text()).toBe('Default at login');
  });

  // Both kinds of chip are the design system's Tag rather than a bespoke pill, so
  // they stay in step with it.
  it('should build the meta line out of the same tag as the chips', () => {
    const wrapper = createWrapper({
      title: 'okta-corp', chips: ['OAuth'], meta: 'github-two'
    });

    const tags = wrapper.findAllComponents(RcTag);

    expect(tags).toHaveLength(2);
    expect(tags.every((tag) => tag.props('type') === 'inactive')).toBe(true);
    expect(wrapper.find('.auth-provider-row__meta').classes()).toContain('rc-tag');
  });

  it('should show the vendor mark', () => {
    const wrapper = createWrapper({ title: 'okta-corp', icon: 'okta.svg' });

    expect(wrapper.findComponent(AuthProviderLogo).props('icon')).toBe('okta.svg');
  });

  it('should report the provider state as a badge', () => {
    const wrapper = createWrapper({
      title: 'okta-corp', status: 'success', statusLabel: 'Active'
    });

    const badge = wrapper.findComponent(RcStatusBadge);

    expect(badge.props('status')).toBe('success');
    expect(badge.text()).toBe('Active');
  });

  it('should leave the badge out when the row has no state to report', () => {
    const wrapper = createWrapper({ title: 'okta-corp' });

    expect(wrapper.findComponent(RcStatusBadge).exists()).toBe(false);
  });

  it('should become a link when given a destination', () => {
    const to = { name: 'c-cluster-auth-config-id', params: { id: 'okta-corp' } };
    const wrapper = createWrapper({ title: 'okta-corp', to });

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.props('to')).toStrictEqual(to);
    expect(link.classes()).toContain('auth-provider-row__title');
  });

  describe('activating the row', () => {
    const to = { name: 'c-cluster-auth-config-id', params: { id: 'okta-corp' } };

    // Only the title used to be a target, which left most of the row inert.
    it.each([
      ['the description', '.auth-provider-row__description'],
      ['the vendor mark', '.auth-provider-logo'],
      ['empty space in the row', '.auth-provider-row__content'],
    ])('should go to the config when the click lands on %s', async(_case, selector) => {
      const wrapper = createWrapper({
        title: 'okta-corp', description: 'Partners and contractors.', to
      });

      await wrapper.find(selector).trigger('click');

      expect(mockPush).toHaveBeenCalledWith(to);
    });

    // The title is a real link and navigates itself, so handling the click here
    // as well would push the same route twice.
    it('should leave the title link to navigate by itself', async() => {
      const wrapper = createWrapper({ title: 'okta-corp', to });

      await wrapper.find('.auth-provider-row__title').trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });

    // A control in a slot has its own job - the actions menu, the local users link.
    it.each([
      ['the trailing slot', 'trailing', '<button class="row-action">Actions</button>', '.row-action'],
      ['the meta slot', 'meta-trailing', '<a class="meta-action">Manage local users</a>', '.meta-action'],
    ])('should let a control in %s act instead of navigating', async(_case, slot, markup, selector) => {
      const wrapper = mount(AuthProviderRow, {
        props:  { title: 'okta-corp', to },
        slots:  { [slot]: markup },
        global: { stubs: { 'router-link': RouterLinkStub } }
      });

      await wrapper.find(selector).trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate from a row that has no destination', async() => {
      const wrapper = createWrapper({ title: 'Local authentication', description: 'Accounts for administrators.' });

      await wrapper.find('.auth-provider-row__description').trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // The slot used to be gated on a name that never matched, so a row carrying a
  // meta control but no meta line dropped the control entirely.
  it('should keep a meta control on a row that has no meta line', () => {
    const wrapper = mount(AuthProviderRow, {
      props:  { title: 'Local authentication' },
      slots:  { 'meta-trailing': '<a class="meta-action">Manage local users</a>' },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.auth-provider-row__meta-row .meta-action').exists()).toBe(true);
  });

  // The local provider row has nowhere to go, so it must not look clickable.
  it('should stay plain content when there is nowhere to go', () => {
    const wrapper = createWrapper({ title: 'Local authentication' });

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    expect(wrapper.find('.auth-provider-row__title').element.tagName).toBe('SPAN');
  });

  it('should render whatever the page puts in the trailing slot', () => {
    const wrapper = mount(AuthProviderRow, {
      props:  { title: 'okta-corp' },
      slots:  { trailing: '<button class="row-action">Actions</button>' },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('.auth-provider-row__trailing .row-action').exists()).toBe(true);
  });

  it('should put a meta control beside the meta line rather than at the end of the row', () => {
    const wrapper = mount(AuthProviderRow, {
      props:  { title: 'Local authentication', meta: 'Rancher-managed accounts' },
      slots:  { 'meta-trailing': '<a class="meta-action">Manage local users</a>' },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const metaRow = wrapper.find('.auth-provider-row__meta-row');
    const action = wrapper.find('.meta-action');

    expect(metaRow.exists()).toBe(true);
    expect(metaRow.find('.auth-provider-row__meta').text()).toBe('Rancher-managed accounts');
    expect(metaRow.element.lastElementChild?.contains(action.element)).toBe(true);
  });

  // A control nested inside the row's link would navigate on click, and on Enter
  // and Space, rather than doing its own job.
  it('should keep the trailing controls out of the link', () => {
    const wrapper = mount(AuthProviderRow, {
      props:  { title: 'okta-corp', to: { name: 'c-cluster-auth-config-id' } },
      slots:  { trailing: '<button class="row-action">Actions</button>' },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    expect(wrapper.find('a .row-action').exists()).toBe(false);
    expect(wrapper.find('.row-action').exists()).toBe(true);
  });

  // The rule below a row parts it from the row underneath, so a row with nothing
  // under it draws a line under the whole page for no reason.
  it.each([
    [undefined, true],
    [true, true],
    [false, false],
  ])('should draw the rule below the row for divided %p', (divided, expected) => {
    const wrapper = createWrapper({ title: 'okta-corp', divided });

    expect(wrapper.classes().includes('auth-provider-row--divided')).toBe(expected);
  });
});
