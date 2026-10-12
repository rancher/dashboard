import { shallowMount } from '@vue/test-utils';
import AuthConfigList from '@shell/pages/c/_cluster/auth/config/index.vue';
import AuthProviderAccessDrawer from '@shell/components/auth/AuthProviderAccessDrawer.vue';
import AuthProviderRow from '@shell/components/auth/AuthProviderRow.vue';
import AuthProvidersEmptyState from '@shell/components/auth/AuthProvidersEmptyState.vue';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import { providerConfigs } from '@shell/models/management.cattle.io.authconfig';

const localConfig: any = { id: 'local', enabled: true };

const oktaConfig = {
  id:           'okta',
  enabled:      true,
  nameDisplay:  'Okta',
  provider:     'Okta',
  sideLabel:    'SAML',
  icon:         'okta.svg',
  stateDisplay: 'Active',
  description:  'Corporate SSO for employees.',
};

const disabledConfig = {
  id: 'github', enabled: false, nameDisplay: 'github', provider: 'GitHub', sideLabel: 'OAuth'
};

const createFeature = (value: boolean, lockedValue: boolean | null = null) => ({
  spec:   { value },
  status: { lockedValue },
  save:   jest.fn(),
});

const createWrapper = ({
  configs = [localConfig, oktaConfig],
  placeholders = [] as any[],
  feature = createFeature(false),
  canUpdateFeature = true,
} = {}) => shallowMount(AuthConfigList, {
  // The page loads its configs in fetch(), which shallowMount does not run
  data:   () => ({ allConfigs: configs, placeholders } as any),
  global: {
    mocks: {
      $route:      { params: { cluster: 'local' } },
      $fetchState: { pending: false, error: null },
      $store:      {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          'features/get':         () => feature.spec.value,
          'management/byId':      () => feature,
          'management/schemaFor': () => ({ resourceMethods: canUpdateFeature ? ['GET', 'PUT'] : ['GET'] }),
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
    expect(rows[0].props('title')).toBe('Okta');
    expect(rows[0].props('meta')).toBe('okta');
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

  // Rancher pre-creates a disabled authconfig per supported provider; those are
  // the picker's catalogue, not configured providers.
  it('should keep unconfigured providers out of the list', () => {
    const wrapper = createWrapper({ configs: [localConfig, oktaConfig, disabledConfig] });

    const titles = wrapper.findAllComponents(AuthProviderRow).map((row) => row.props('title'));

    expect(titles).not.toContain('GitHub');
  });

  // The rule between rows parts one from the next, so a single external provider
  // has nothing to be parted from.
  it.each([
    ['a single external provider is configured', [localConfig, oktaConfig], false],
    ['multiple external providers are configured', [localConfig, oktaConfig, { ...oktaConfig, id: 'azuread' }], true],
  ])('should draw the rule below the row when %s', (_label, configs, expected) => {
    const wrapper = createWrapper({ configs });
    const [externalRow] = wrapper.findAllComponents(AuthProviderRow);

    expect(externalRow.props('divided')).toBe(expected);
  });

  // The provider page opens on how the provider itself is configured, which is
  // not what the row is about - who may log in with it is.
  describe('opening a provider', () => {
    it('should open the access panel rather than leave the page', async() => {
      const wrapper = createWrapper();
      const row = wrapper.findAllComponents(AuthProviderRow)[0];

      expect(row.props('to')).toBeUndefined();
      expect(row.props('selectable')).toBe(true);

      await row.vm.$emit('select');

      const [mutation, payload] = ((wrapper.vm as any).$store.commit as jest.Mock).mock.calls[0];

      expect(mutation).toBe('slideInPanel/open');
      expect(payload.component).toBe(AuthProviderAccessDrawer);
      expect(payload.componentProps.resource).toStrictEqual(oktaConfig);
    });

    it('should close the panel when it asks to be closed', async() => {
      const wrapper = createWrapper();

      await wrapper.findAllComponents(AuthProviderRow)[0].vm.$emit('select');

      const { onClose } = ((wrapper.vm as any).$store.commit as jest.Mock).mock.calls[0][1].componentProps;

      onClose();

      expect((wrapper.vm as any).$store.commit).toHaveBeenCalledWith('slideInPanel/close');
    });

    // The panel is a trap for focus while it is open, so focus has to have
    // somewhere to go back to once it closes.
    it('should send focus back to the row it was opened from', async() => {
      const wrapper = createWrapper();

      await wrapper.findAllComponents(AuthProviderRow)[0].vm.$emit('select');

      const { returnFocusSelector } = ((wrapper.vm as any).$store.commit as jest.Mock).mock.calls[0][1].componentProps;

      expect(returnFocusSelector).toBe('[data-testid="auth-config-row-okta"] .auth-provider-row__title');
    });
  });

  describe('adding a provider', () => {
    it('should offer the providers that can be configured', () => {
      const wrapper = createWrapper({
        configs: [
          localConfig,
          // Pre-created but not configurable in the UI
          { id: 'oidc', enabled: false },
          disabledConfig,
          oktaConfig,
        ],
      });

      (wrapper.vm as any).promptAddProvider();

      const [action, payload] = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls[0];
      const ids = payload.componentProps.rows.map((r: any) => r.id);

      expect(action).toBe('management/promptModal');
      expect(payload.component).toBe('AddAuthProviderDialog');
      // A width with no unit is not valid CSS, and the modal silently falls back to 600px
      expect(payload.modalWidth).toMatch(/(px|%)$/);
      expect(ids).toStrictEqual(expect.arrayContaining(['github', 'okta']));
      expect(ids).not.toContain('local');
      expect(ids).not.toContain('oidc');
      // Each provider is offered once, from its config where there is one
      expect(new Set(ids).size).toBe(ids.length);
      expect(payload.componentProps.rows.find((r: any) => r.id === 'okta')).toStrictEqual(oktaConfig);
    });

    // Rancher only creates the local config, the others are created when first chosen
    it('should create a placeholder for each provider that has no config yet', async() => {
      const dispatch = jest.fn((action: string, data: any) => {
        if (action === 'management/findAll') {
          return Promise.resolve([localConfig, disabledConfig]);
        }

        return Promise.resolve(action === 'management/createMany' ? data : undefined);
      });
      const vm: any = { $store: { dispatch } };

      await (AuthConfigList as any).fetch.call(vm);

      const expected = Object.keys(providerConfigs).filter((id) => id !== 'github');

      expect(dispatch).toHaveBeenCalledWith('management/createMany', expect.any(Array));
      expect(vm.placeholders.map((p: any) => p.id).sort()).toStrictEqual(expected.sort());
      expect(vm.placeholders[0].type).toBe('management.cattle.io.authconfig');
    });

    it('should offer the providers that have no config yet', () => {
      const placeholders = ['github', 'okta', 'oidc'].map((id) => ({ id, provider: id }));
      const wrapper = createWrapper({ configs: [localConfig, oktaConfig], placeholders });

      (wrapper.vm as any).promptAddProvider();

      const { rows } = ((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls[0][1].componentProps;

      // okta comes from its config, and oidc can't be configured in the UI
      expect(rows.map((r: any) => r.id).sort()).toStrictEqual(['github', 'okta']);
      expect(rows.find((r: any) => r.id === 'okta')).toStrictEqual(oktaConfig);
    });

    const chooseProvider = async(wrapper: any, id: string) => {
      wrapper.vm.promptAddProvider();

      const { selectCb } = (wrapper.vm.$store.dispatch as jest.Mock).mock.calls[0][1].componentProps;

      await selectCb(id);
    };

    const editLocation = (id: string) => ({
      name:   'c-cluster-auth-config-id',
      params: { cluster: 'local', id },
      query:  { mode: 'edit' },
    });

    it('should send the chosen provider to its own config page', async() => {
      const push = jest.fn();
      const wrapper = createWrapper({ configs: [localConfig, disabledConfig] });

      (wrapper.vm as any).$router = { push };
      await chooseProvider(wrapper, 'github');

      expect(push).toHaveBeenCalledWith(editLocation('github'));
      // The config is already there, so there is nothing to create
      expect(((wrapper.vm as any).$store.dispatch as jest.Mock).mock.calls.map(([action]) => action)).not.toContain('management/request');
    });

    it('should create the config of a provider that has none before configuring it', async() => {
      const push = jest.fn();
      const wrapper = createWrapper({ configs: [localConfig] });

      (wrapper.vm as any).$router = { push };
      await chooseProvider(wrapper, 'azuread');

      const dispatch = (wrapper.vm as any).$store.dispatch as jest.Mock;
      const [action, request] = dispatch.mock.calls[1];

      expect(action).toBe('management/request');
      expect(request.method).toBe('POST');
      expect(request.url).toBe('/k8s/clusters/local/apis/management.cattle.io/v3/authconfigs');
      expect(request.data).toMatchObject({
        kind:               'AuthConfig',
        metadata:           { name: 'azuread' },
        type:               'azureADConfig',
        enabled:            false,
        logoutAllSupported: true,
      });
      expect(push).toHaveBeenCalledWith(editLocation('azuread'));
    });

    it('should configure a provider whose config was created in the meantime', async() => {
      const push = jest.fn();
      const wrapper = createWrapper({ configs: [localConfig] });
      const dispatch = (wrapper.vm as any).$store.dispatch as jest.Mock;

      dispatch.mockImplementation((action: string) => (action === 'management/request' ? Promise.reject(Object.assign(new Error('Conflict'), { _status: 409 })) : undefined));
      (wrapper.vm as any).$router = { push };
      await chooseProvider(wrapper, 'github');

      expect(push).toHaveBeenCalledWith(editLocation('github'));
      expect(dispatch.mock.calls.map(([action]) => action)).not.toContain('growl/fromError');
    });

    it('should stay on the list when the config cannot be created', async() => {
      const push = jest.fn();
      const wrapper = createWrapper({ configs: [localConfig] });
      const dispatch = (wrapper.vm as any).$store.dispatch as jest.Mock;
      const err = Object.assign(new Error('Forbidden'), { _status: 403 });

      dispatch.mockImplementation((action: string) => (action === 'management/request' ? Promise.reject(err) : undefined));
      (wrapper.vm as any).$router = { push };
      await chooseProvider(wrapper, 'github');

      expect(push).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/fromError', expect.objectContaining({ err }));
    });

    // Rancher runs one external provider at a time, so there is nothing to add
    // until the configured one is disabled.
    it('should not offer to add another once one is configured', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(AuthProvidersEmptyState).exists()).toBe(false);
      expect(wrapper.find('[data-testid="auth-config-create"]').exists()).toBe(false);
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
    });

    // Turning local login off with nothing to replace it locks everyone out.
    it('should not offer to disable local login', () => {
      const wrapper = createWrapper({ configs: [localConfig] });

      expect(wrapper.findComponent(DisableLocalLoginCard).exists()).toBe(false);
    });

    it('should still show the local provider', () => {
      const wrapper = createWrapper({ configs: [localConfig] });

      const rows = wrapper.findAllComponents(AuthProviderRow);

      expect(rows).toHaveLength(1);
      expect(rows[0].props('title')).toBe('%authConfig.list.localRow.title%');
    });
  });

  describe('the local provider row', () => {
    const localRow = (wrapper: any) => wrapper.findAllComponents(AuthProviderRow)[1];

    it('should describe what local accounts are for', () => {
      expect(localRow(createWrapper()).props('description')).toBe('%authConfig.list.localRow.description%');
    });

    // What local accounts are for stops being the point once they cannot be used.
    it('should describe what became of local accounts once login is off', () => {
      const wrapper = createWrapper({ feature: createFeature(true) });

      expect(localRow(wrapper).props('description')).toBe('%authConfig.list.localRow.descriptionDisabled%');
    });

    // An admin can annotate the local config the same as any other, and that
    // wins over either piece of generic copy.
    it.each([true, false])('should prefer a description set on the local config while disabled is %s', (disabled) => {
      const wrapper = createWrapper({
        configs: [{ ...localConfig, description: 'Break-glass only.' }, oktaConfig],
        feature: createFeature(disabled),
      });

      expect(localRow(wrapper).props('description')).toBe('Break-glass only.');
    });

    // The row is the one place that says local login is unusable, so it cannot
    // read like every other active provider.
    it('should mark the row as disabled once local login is off', () => {
      const wrapper = createWrapper({ feature: createFeature(true) });

      expect(localRow(wrapper).props('disabled')).toBe(true);
      expect(localRow(wrapper).props('status')).toBe('error');
      expect(localRow(wrapper).props('statusLabel')).toBe('%authConfig.list.localRow.disabled%');
    });

    it('should leave the row unmarked while local login works', () => {
      const wrapper = createWrapper();

      expect(localRow(wrapper).props('disabled')).toBe(false);
      expect(localRow(wrapper).props('status')).toBe('success');
      expect(localRow(wrapper).props('statusLabel')).toBe('%authConfig.list.localRow.active%');
    });

    // Local closes the page, so a rule under it parts it from nothing.
    it('should end the page without a rule under it', () => {
      const wrapper = createWrapper();

      expect(localRow(wrapper).props('divided')).toBe(false);
    });
  });

  describe('disabling local login', () => {
    const disableCbFrom = (wrapper: any) => {
      const [action, payload] = (wrapper.vm.$store.dispatch as jest.Mock).mock.calls[0];

      expect(action).toBe('management/promptModal');
      expect(payload.component).toBe('DisableLocalLoginDialog');

      return payload.componentProps.disableCb;
    };

    // Leaving the external providers as the only way in is worth a confirmation,
    // so the switch must not write the flag on its own.
    it('should confirm before turning local login off', async() => {
      const feature = createFeature(false);
      const wrapper = createWrapper({ feature });

      await wrapper.findComponent(DisableLocalLoginCard).vm.$emit('update:value', true);

      expect(feature.spec.value).toBe(false);
      expect(feature.save).not.toHaveBeenCalled();
      expect(disableCbFrom(wrapper)).toEqual(expect.any(Function));
    });

    it('should write the flag once the dialog confirms', async() => {
      const feature = createFeature(false);
      const wrapper = createWrapper({ feature });

      await wrapper.findComponent(DisableLocalLoginCard).vm.$emit('update:value', true);
      await disableCbFrom(wrapper)();

      expect(feature.spec.value).toBe(true);
      expect(feature.save).toHaveBeenCalledWith();
    });

    // Putting local login back is only ever a widening of the ways in, so there
    // is nothing to warn about.
    it('should write the value straight to the feature flag when turning it back on', async() => {
      const feature = createFeature(true);
      const wrapper = createWrapper({ feature });

      await wrapper.findComponent(DisableLocalLoginCard).vm.$emit('update:value', false);

      expect(feature.spec.value).toBe(false);
      expect(feature.save).toHaveBeenCalledWith();
      expect(wrapper.vm.$store.dispatch).not.toHaveBeenCalled();
    });

    it('should put the flag back and explain itself when the save fails', async() => {
      const feature = createFeature(true);

      feature.save.mockRejectedValue(new Error('nope'));

      const wrapper = createWrapper({ feature });

      await wrapper.findComponent(DisableLocalLoginCard).vm.$emit('update:value', false);

      expect(feature.spec.value).toBe(true);
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
});
