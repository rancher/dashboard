import { shallowMount } from '@vue/test-utils';
import AuthConfigList from '@shell/pages/c/_cluster/auth/config/index.vue';
import AuthProviderAccessDrawer from '@shell/components/auth/AuthProviderAccessDrawer.vue';
import AuthProviderRow from '@shell/components/auth/AuthProviderRow.vue';
import AuthProvidersEmptyState from '@shell/components/auth/AuthProvidersEmptyState.vue';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import AuthProvidersPrimeNotice from '@shell/components/auth/AuthProvidersPrimeNotice.vue';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

const localConfig: any = { id: 'local', enabled: true };

const oktaConfig = {
  id:           'okta-corp',
  _type:        'oktaConfig',
  enabled:      true,
  nameDisplay:  'Okta (okta-corp)',
  provider:     'Okta',
  sideLabel:    'SAML',
  icon:         'okta.svg',
  stateDisplay: 'Active',
  description:  'Corporate SSO for employees.',
};

const disabledConfig = {
  id:           'github',
  _type:        'githubConfig',
  enabled:      false,
  nameDisplay:  'github',
  provider:     'GitHub',
  sideLabel:    'OAuth',
  stateDisplay: 'Inactive',
};

// The catalogue the add-provider picker is drawn from, as the server reports it
const providerTypes = [
  {
    id: 'github', configTypeName: 'githubConfig', name: 'GitHub', category: 'oauth', categoryLabel: 'OAuth', icon: 'github.svg'
  },
  {
    id: 'okta', configTypeName: 'oktaConfig', name: 'Okta', category: 'saml', categoryLabel: 'SAML', icon: 'okta.svg'
  },
];

const createFeature = (value: boolean, lockedValue: boolean | null = null) => ({
  spec:   { value },
  status: { lockedValue },
  save:   jest.fn(),
});

// Whether the server has the `multiple-auth-providers` feature on
let multipleAllowed = false;

const createWrapper = ({
  configs = [localConfig, oktaConfig],
  types = providerTypes,
  feature = createFeature(false),
  canUpdateFeature = true,
} = {}) => shallowMount(AuthConfigList, {
  // The page loads both in fetch(), which shallowMount does not run
  data:   () => ({ allConfigs: configs, providerTypes: types } as any),
  global: {
    mocks: {
      $route:      { params: { cluster: 'local' } },
      $fetchState: { pending: false, error: null },
      $store:      {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          'features/get':         (name: string) => (name === 'multiple-auth-providers' ? multipleAllowed : feature.spec.value),
          'management/byId':      () => feature,
          'management/schemaFor': () => ({ resourceMethods: canUpdateFeature ? ['GET', 'PUT'] : ['GET'] }),
          'i18n/withFallback':    (_key: string, _args: any, fallback: string) => fallback,
        },
      },
    },
  },
});

describe('page: AuthConfigList', () => {
  it('should list the providers that have been configured', () => {
    const wrapper = createWrapper();

    const rows = wrapper.findAllComponents(AuthProviderRow);

    // One for Okta, one for the local provider section
    expect(rows).toHaveLength(2);
    // The provider's own label, with the config's name in the chip beside it
    expect(rows[0].props('title')).toBe('Okta');
    expect(rows[0].props('meta')).toBe('okta-corp');
    expect(rows[0].props('chips')).toStrictEqual(['SAML']);
    expect(rows[0].props('icon')).toBe('okta.svg');
    expect(rows[0].props('statusLabel')).toBe('Active');
  });

  it('should describe a provider with the description its config carries', () => {
    const rows = createWrapper().findAllComponents(AuthProviderRow);

    expect(rows[0].props('description')).toBe('Corporate SSO for employees.');
  });

  it('should leave the description off a provider whose config has none', () => {
    const wrapper = createWrapper({ configs: [localConfig, { ...oktaConfig, description: undefined }] });

    expect(wrapper.findAllComponents(AuthProviderRow)[0].props('description')).toBeUndefined();
  });

  // Nothing is pre-created any more, so a config that exists is one somebody
  // added - hiding it while it is switched off would strand it.
  it('should list a provider that has been added but switched off', () => {
    const wrapper = createWrapper({ configs: [localConfig, oktaConfig, disabledConfig] });

    const github = wrapper.findAllComponents(AuthProviderRow)[1];

    expect(github.props('title')).toBe('GitHub');
    expect(github.props('status')).toBe('none');
    expect(github.props('statusLabel')).toBe('Inactive');
  });

  it('should mark a provider that is switched on', () => {
    expect(createWrapper().findAllComponents(AuthProviderRow)[0].props('status')).toBe('success');
  });

  it('should open the access panel when a provider row is selected', () => {
    const wrapper = createWrapper();
    const row = wrapper.findAllComponents(AuthProviderRow)[0];

    expect(row.props('selectable')).toBe(true);
    expect(row.props('to')).toBeUndefined();

    row.vm.$emit('select');

    expect(((wrapper.vm as any).$store.commit as jest.Mock)).toHaveBeenCalledWith('slideInPanel/open', expect.objectContaining({
      component:      AuthProviderAccessDrawer,
      componentProps: expect.objectContaining({ resource: oktaConfig }),
    }));
  });

  it('should size the add provider header action like resource list actions', () => {
    multipleAllowed = true;
    const wrapper = createWrapper();

    multipleAllowed = false;

    expect(wrapper.find('[data-testid="auth-config-create"]').attributes('size')).toBe('large');
  });

  describe('adding a provider', () => {
    // With multiple providers allowed, these add alongside the enabled Okta config
    beforeEach(() => {
      multipleAllowed = true;
    });

    afterEach(() => {
      multipleAllowed = false;
    });

    // The picker is for new entries, so it offers the provider types the server
    // supports rather than anything read off the configs that already exist.
    it('should offer the provider types the server supports', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).promptAddProvider();

      const [action, payload] = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls[0];

      expect(action).toBe('management/promptModal');
      expect(payload.component).toBe('AddAuthProviderDialog');
      // A width with no unit is not valid CSS, and the modal silently falls back to 600px
      expect(payload.modalWidth).toMatch(/(px|%)$/);
      expect(payload.componentProps.rows).toStrictEqual(providerTypes);
    });

    // Every connection to a provider is a config of its own, and its name has to
    // be settled before it can be created - there is no empty config waiting.
    it('should send the chosen provider type to the add page', () => {
      const push = jest.fn();
      const wrapper = createWrapper();

      (wrapper.vm as any).$router = { push };
      (wrapper.vm as any).promptAddProvider();

      const { selectCb } = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls[0][1].componentProps;

      selectCb('github');

      expect(push).toHaveBeenCalledWith({
        name:   'c-cluster-auth-config-create-provider',
        params: { cluster: 'local', provider: 'github' },
      });
    });

    it('should send a provider type that is already in use to the same page', () => {
      const push = jest.fn();
      const wrapper = createWrapper({ configs: [localConfig, oktaConfig] });

      (wrapper.vm as any).$router = { push };
      (wrapper.vm as any).promptAddProvider();

      const { selectCb } = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls[0][1].componentProps;

      selectCb('okta');

      expect(push).toHaveBeenCalledWith({
        name:   'c-cluster-auth-config-create-provider',
        params: { cluster: 'local', provider: 'okta' },
      });
    });
  });

  // Branding is how the login screen is customised, and that is worth reaching
  // whether or not any provider has been added yet.
  it.each([
    ['providers are configured', [localConfig, oktaConfig]],
    ['no provider is configured', [localConfig]],
  ])('should link to the login screen branding when %s', (_label, configs) => {
    const wrapper = createWrapper({ configs });

    expect(wrapper.find('[data-testid="auth-config-customise-login"]').exists()).toBe(true);
  });

  describe('when no external provider is configured', () => {
    it('should guide the user to add one', () => {
      const wrapper = createWrapper({ configs: [localConfig] });

      expect(wrapper.findComponent(AuthProvidersEmptyState).exists()).toBe(true);
      expect(wrapper.find('[data-testid="auth-config-create"]').exists()).toBe(false);
    });

    // Turning local login off with nothing to replace it locks everyone out.
    it('should not offer to disable local login', () => {
      const wrapper = createWrapper({ configs: [localConfig] });

      expect(wrapper.findComponent(DisableLocalLoginCard).exists()).toBe(false);
    });

    // A provider that has been added but switched off cannot let anybody in either
    it('should not offer to disable local login for a provider that is switched off', () => {
      const wrapper = createWrapper({ configs: [localConfig, disabledConfig] });

      expect(wrapper.findComponent(DisableLocalLoginCard).exists()).toBe(false);
    });

    it('should still show the local provider', () => {
      const wrapper = createWrapper({ configs: [localConfig] });

      const rows = wrapper.findAllComponents(AuthProviderRow);

      expect(rows).toHaveLength(1);
      expect(rows[0].props('title')).toBe('%authConfig.list.localRow.title%');
    });
  });

  describe('the Rancher Prime notice', () => {
    beforeEach(() => {
      multipleAllowed = false;
    });

    it('should point community to Prime for more than one provider', () => {
      multipleAllowed = false;

      expect(createWrapper().findComponent(AuthProvidersPrimeNotice).exists()).toBe(true);
    });

    it('should not be shown when multiple providers are allowed', () => {
      multipleAllowed = true;

      expect(createWrapper().findComponent(AuthProvidersPrimeNotice).exists()).toBe(false);
    });

    it('should not be shown before any provider is configured', () => {
      multipleAllowed = false;

      expect(createWrapper({ configs: [localConfig] }).findComponent(AuthProvidersPrimeNotice).exists()).toBe(false);
    });
  });

  describe('the community provider limit', () => {
    const createButton = (wrapper: any) => wrapper.find('[data-testid="auth-config-create"]');

    beforeEach(() => {
      multipleAllowed = false;
    });

    it('should not offer to add a provider in community while one is enabled', () => {
      multipleAllowed = false;

      expect(createButton(createWrapper()).exists()).toBe(false);
    });

    it('should offer to add another provider when multiple are allowed', () => {
      multipleAllowed = true;

      expect(createButton(createWrapper()).exists()).toBe(true);
    });

    it('should not open the provider picker in community while a provider is enabled', () => {
      multipleAllowed = false;
      const wrapper = createWrapper();

      (wrapper.vm as any).promptAddProvider();

      expect(wrapper.vm.$store.dispatch).not.toHaveBeenCalledWith('management/promptModal', expect.anything());
    });

    it('should offer to add a provider in community when the configured one is switched off', () => {
      multipleAllowed = false;

      expect(createButton(createWrapper({ configs: [localConfig, disabledConfig] })).exists()).toBe(true);
    });

    it('should open the provider picker in community before any provider exists', () => {
      multipleAllowed = false;
      const wrapper = createWrapper({ configs: [localConfig] });

      (wrapper.vm as any).promptAddProvider();

      expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('management/promptModal', expect.objectContaining({ component: 'AddAuthProviderDialog' }));
    });

    it('should open the provider picker when multiple are allowed and a provider is enabled', () => {
      multipleAllowed = true;
      const wrapper = createWrapper();

      (wrapper.vm as any).promptAddProvider();

      expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('management/promptModal', expect.objectContaining({ component: 'AddAuthProviderDialog' }));
    });
  });

  describe('the local provider row', () => {
    const localRow = (wrapper: any) => wrapper.findAllComponents(AuthProviderRow)[1];

    it('should show the Rancher local mark', () => {
      expect(localRow(createWrapper()).props('icon')).toBe('~shell/assets/images/vendor/local.svg');
    });

    it('should describe what local accounts are for', () => {
      expect(localRow(createWrapper()).props('description')).toBe('%authConfig.list.localRow.description%');
    });

    // An admin can annotate the local config the same as any other, and that
    // wins over the generic copy.
    it('should prefer a description set on the local config', () => {
      const wrapper = createWrapper({ configs: [{ ...localConfig, description: 'Break-glass only.' }, oktaConfig] });

      expect(localRow(wrapper).props('description')).toBe('Break-glass only.');
    });

    // Local closes the page, so a rule under it parts it from nothing.
    it('should end the page without a rule under it', () => {
      const wrapper = createWrapper();
      const rows = wrapper.findAllComponents(AuthProviderRow);

      expect(rows[0].props('divided')).toBe(false);
      expect(localRow(wrapper).props('divided')).toBe(false);
    });
  });

  describe('disabling local login', () => {
    const confirmDisable = async(wrapper: any) => {
      await wrapper.findComponent(DisableLocalLoginCard).vm.$emit('update:value', true);

      const modal = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls.find(([action]) => action === 'management/promptModal');

      await modal[1].componentProps.disableCb();
    };

    it('should write the value straight to the feature flag', async() => {
      const feature = createFeature(false);
      const wrapper = createWrapper({ feature });

      await confirmDisable(wrapper);

      expect(feature.spec.value).toBe(true);
      expect(feature.save).toHaveBeenCalledWith();
    });

    it('should put the flag back and explain itself when the save fails', async() => {
      const feature = createFeature(false);

      feature.save.mockRejectedValue(new Error('nope'));

      const wrapper = createWrapper({ feature });

      await confirmDisable(wrapper);

      expect(feature.spec.value).toBe(false);
      expect((wrapper.vm as any).toggleError).toBe('nope');
    });

    it('should lock the switch when the user cannot write feature flags', () => {
      const wrapper = createWrapper({ canUpdateFeature: false });

      expect(wrapper.findComponent(DisableLocalLoginCard).props('disabled')).toBe(true);
    });

    it('should lock the switch when the server has pinned the flag', () => {
      const wrapper = createWrapper({ feature: createFeature(false, true) });

      expect(wrapper.findComponent(DisableLocalLoginCard).props('disabled')).toBe(true);
    });
  });

  describe('when the provider types cannot be read', () => {
    // Only the add dialog needs the provider types, so a failure to read them
    // must not stop the configured providers being listed.
    it('should still list the providers', async() => {
      const vm: any = {
        providerTypes: null,
        $store:        {
          dispatch: jest.fn((action: string) => (action === 'management/findAll' ? Promise.resolve([localConfig, oktaConfig]) : Promise.reject(new Error('Service Unavailable')))),
          getters:  {},
        },
      };

      vm.loadProviderTypes = (AuthConfigList as any).methods.loadProviderTypes.bind(vm);
      await (AuthConfigList as any).fetch.call(vm);

      expect(vm.allConfigs).toStrictEqual([localConfig, oktaConfig]);
      expect(vm.providerTypes).toBeNull();
    });

    it('should read them again before opening the picker', async() => {
      const wrapper = createWrapper({ configs: [localConfig], types: null as any });
      const dispatch = wrapper.vm.$store.dispatch as jest.Mock;

      dispatch.mockImplementation((action: string) => (action === 'auth/getAuthProviderTypes' ? Promise.resolve({ githubProvider: { Type: 'oauth' } }) : undefined));
      await (wrapper.vm as any).promptAddProvider();

      const [, payload] = dispatch.mock.calls.find(([action]) => action === 'management/promptModal');

      expect(payload.componentProps.rows.map((row: any) => row.id)).toStrictEqual(['github']);
    });

    it('should report a second failure rather than open an empty picker', async() => {
      const wrapper = createWrapper({ configs: [localConfig], types: null as any });
      const dispatch = wrapper.vm.$store.dispatch as jest.Mock;
      const err = new Error('Service Unavailable');

      dispatch.mockImplementation((action: string) => (action === 'auth/getAuthProviderTypes' ? Promise.reject(err) : undefined));
      await (wrapper.vm as any).promptAddProvider();

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', { title: '%generic.notification.title.error%', err });
      expect(dispatch).not.toHaveBeenCalledWith('management/promptModal', expect.anything());
    });
  });

  // Rancher only clears out configs nobody set up, so one made before the
  // dashboard dropped its form for that provider can still be there.
  describe('a provider the dashboard has no form for', () => {
    it('should be left off the list', () => {
      const oidc = {
        id: 'oidc', _type: 'oidcConfig', enabled: false, nameDisplay: 'oidc'
      };
      const rows = createWrapper({ configs: [localConfig, oktaConfig, oidc] }).findAllComponents(AuthProviderRow);

      // One for Okta, one for the local provider section
      expect(rows).toHaveLength(2);
    });

    it('should still count as a way in', () => {
      const oidc = {
        id: 'oidc', _type: 'oidcConfig', enabled: true, nameDisplay: 'oidc'
      };
      const wrapper = createWrapper({ configs: [localConfig, oidc] });

      expect(wrapper.findComponent(DisableLocalLoginCard).exists()).toBe(true);
    });
  });
});
