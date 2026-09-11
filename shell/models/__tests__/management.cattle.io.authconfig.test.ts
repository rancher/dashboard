import AuthConfig, { configTypeForProvider, providerIcon, providerKey } from '@shell/models/management.cattle.io.authconfig';
import Resource from '@shell/plugins/dashboard-store/resource-class';
import { requireAsset } from '@shell/utils/require-asset';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

// Stands in for i18n, echoing the key back so tests can assert on which key was looked up.
const rootGetters = { 'i18n/withFallback': (key: string) => key, 'i18n/t': (key: string) => key };

const makeConfig = (data: Object) => new AuthConfig(data, { rootGetters } as any);

describe('fx: providerKey', () => {
  // Rancher names the same provider two ways, and the casing isn't consistent
  // between them -- `googleOauthConfig` becomes `googleOAuthProvider`.
  const cases: [string | null | undefined, string][] = [
    ['activeDirectoryConfig', 'activedirectory'],
    ['activeDirectoryProvider', 'activedirectory'],
    ['githubConfig', 'github'],
    ['githubProvider', 'github'],
    ['keyCloakOIDCConfig', 'keycloakoidc'],
    ['keyCloakOIDCProvider', 'keycloakoidc'],
    ['googleOauthConfig', 'googleoauth'],
    ['googleOAuthProvider', 'googleoauth'],
    ['localConfig', 'local'],
    ['', ''],
    [undefined, ''],
    [null, ''],
  ];

  it.each(cases)('should normalise %p to %p', (input, expected) => {
    expect(providerKey(input)).toBe(expected);
  });
});

describe('fx: configTypeForProvider', () => {
  const cases: [string | undefined, string | undefined][] = [
    ['activeDirectoryProvider', 'ldap'],
    ['githubProvider', 'oauth'],
    ['githubAppProvider', 'oauth'],
    ['googleOAuthProvider', 'oauth'],
    ['keyCloakProvider', 'saml'],
    ['keyCloakOIDCProvider', 'oidc'],
    ['genericSAMLProvider', 'saml'],
    ['localProvider', ''],
    ['notAProvider', undefined],
    [undefined, undefined],
  ];

  it.each(cases)('should resolve %p to %p', (input, expected) => {
    expect(configTypeForProvider(input)).toBe(expected);
  });

  it('should resolve the config naming as well as the provider naming', () => {
    expect(configTypeForProvider('githubConfig')).toBe('oauth');
    expect(configTypeForProvider('githubProvider')).toBe('oauth');
  });
});

describe('fx: providerIcon', () => {
  // The login page reads raw `/v1-public/authproviders` rows, which use the
  // `...Provider` naming rather than the `...Config` naming of the model.
  it.each([
    ['githubProvider', 'github'],
    ['activeDirectoryProvider', 'activedirectory'],
    ['oktaProvider', 'okta'],
  ])('should derive the asset name from %p', (type: string, expected: string) => {
    expect(providerIcon(type)).toBe(`~shell/assets/images/vendor/${ expected }.svg`);
  });

  it.each([
    ['azureADProvider', 'entraid'],
    ['genericOIDCProvider', 'openid'],
    ['keyCloakOIDCProvider', 'keycloak'],
    ['oidcProvider', 'openid'],
  ])('should apply the override for %p', (type: string, expected: string) => {
    expect(providerIcon(type)).toBe(`~shell/assets/images/vendor/${ expected }.svg`);
  });

  it('should resolve the config naming and the provider naming to one asset', () => {
    expect(providerIcon('githubConfig')).toBe(providerIcon('githubProvider'));
  });

  it('should fall back to an empty string when the vendor has no logo', () => {
    // `local` has no vendor SVG, so `requireAsset` throws for it.
    jest.mocked(requireAsset).mockImplementationOnce(() => {
      throw new Error('Asset not found');
    });

    expect(providerIcon('localProvider')).toBe('');
  });

  it.each([undefined, null, ''])('should not throw for %p', (type) => {
    jest.mocked(requireAsset).mockImplementationOnce(() => {
      throw new Error('Asset not found');
    });

    expect(providerIcon(type as any)).toBe('');
  });
});

describe('class AuthConfig', () => {
  // The action menu resolves an action to a method of the same name on the model.
  // Without one, picking Disable silently does nothing.
  describe('disable', () => {
    const makeDisableable = (norman: any, clone?: any) => {
      const dispatch = jest.fn((action: string) => {
        if (action === 'rancher/find') {
          return Promise.resolve(norman);
        }

        return action === 'rancher/clone' ? Promise.resolve(clone) : Promise.resolve();
      });

      const config = new AuthConfig(
        { id: 'github', _type: 'githubConfig' },
        { rootGetters, dispatch } as any
      );

      return { config, dispatch };
    };

    it('should be a method the action menu can actually call', () => {
      expect(typeof makeConfig({ id: 'github' }).disable).toBe('function');
    });

    // Disabling deletes everything stored for the provider, so the action menu
    // must confirm rather than firing it straight off a single click.
    it('should confirm before disabling', () => {
      const { config, dispatch } = makeDisableable({});

      config.promptDisable();

      const call = (dispatch.mock.calls as any[])[0];

      expect(call[0]).toBe('promptModal');
      expect(call[1].component).toBe('DisableAuthProviderDialog');
      expect(call[1].componentProps.name).toBe(config.nameDisplay);
    });

    it('should disable only once the dialog calls back', async() => {
      const norman = { hasAction: () => true, doAction: jest.fn() };
      const { config, dispatch } = makeDisableable(norman);

      config.promptDisable();

      const { disableCb } = (dispatch.mock.calls as any[])[0][1].componentProps;

      expect(norman.doAction).not.toHaveBeenCalled();

      await disableCb();

      expect(norman.doAction).toHaveBeenCalledWith('disable');
    });

    it('should run the norman action for the matching config', async() => {
      const norman = { hasAction: () => true, doAction: jest.fn() };
      const { config, dispatch } = makeDisableable(norman);

      await config.disable();

      expect(dispatch).toHaveBeenCalledWith('rancher/find', {
        type: 'authconfig',
        id:   'github',
        opt:  { url: '/v3/authconfig/github', force: true },
      }, { root: true });
      expect(norman.doAction).toHaveBeenCalledWith('disable');
    });

    // Not every provider advertises the action, so the flag is written directly.
    it('should fall back to saving the flag when there is no action', async() => {
      const clone = { enabled: true, save: jest.fn() };
      const { config } = makeDisableable({ hasAction: () => false }, clone);

      await config.disable();

      expect(clone.enabled).toBe(false);
      expect(clone.save).toHaveBeenCalledWith();
    });

    it('should report a failure rather than leaving it uncaught', async() => {
      const norman = {
        hasAction: () => true,
        doAction:  jest.fn().mockRejectedValue({ code: 'PermissionDenied', status: 403 }),
      };
      const { config, dispatch } = makeDisableable(norman);

      await expect(config.disable()).resolves.toBeUndefined();

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'generic.notification.title.error',
        err:   { code: 'PermissionDenied', status: 403 },
      }, { root: true });
    });

    // The list reads `enabled` off the cached resource, so it has to be re-fetched.
    it('should refresh the config so the list reflects the change', async() => {
      const { config, dispatch } = makeDisableable({ hasAction: () => true, doAction: jest.fn() });

      await config.disable();

      expect(dispatch).toHaveBeenCalledWith('find', {
        type: 'management.cattle.io.authconfig',
        id:   'github',
        opt:  { force: true },
      });
    });
  });

  // Auth configs are edited through their own route, so the inherited menu's
  // `goToEdit` would otherwise land on the generic resource page.
  describe('detailLocation', () => {
    it('should point at the auth config page for this config', () => {
      const config = new AuthConfig(
        { id: 'github', _type: 'githubConfig' },
        { rootGetters: { ...rootGetters, clusterId: 'local' } } as any
      );

      expect(config.detailLocation).toStrictEqual({
        name:   'c-cluster-auth-config-id',
        params: { cluster: 'local', id: 'github' },
      });
    });
  });

  describe('_availableActions', () => {
    // The parent getter reads runtime config the tests don't have, so it stands
    // in for whatever the base class offers.
    const inherited = [
      { action: 'showConfiguration', label: 'action.showConfiguration' },
      { divider: true },
      { action: 'goToEdit', label: 'action.edit' },
      { divider: true },
      { action: 'download', label: 'action.download' },
      { action: 'promptRemove', label: 'action.remove' },
    ];

    beforeEach(() => {
      jest.spyOn(Resource.prototype, '_availableActions', 'get').mockReturnValue([...inherited]);
    });

    afterEach(() => jest.restoreAllMocks());

    // A rule between every pair of entries is noise. One says where the group
    // that works on the config ends and the group that takes it away begins.
    it('should part the menu into two groups with a single divider', () => {
      const actions = makeConfig({ id: 'github', enabled: true })._availableActions;

      expect(actions.filter((a: any) => a.divider)).toHaveLength(1);
      expect(actions.map((a: any) => a.action || 'divider')).toStrictEqual([
        'showConfiguration',
        'goToEdit',
        'download',
        'divider',
        'promptDisable',
        'promptRemove',
      ]);
    });

    it('should offer disabling only while the provider is enabled', () => {
      const enabled = makeConfig({ id: 'github', enabled: true })._availableActions;
      const disabled = makeConfig({ id: 'github', enabled: false })._availableActions;

      const disableAction = (actions: any[]) => actions.find((a) => a.action === 'promptDisable');

      expect(disableAction(enabled).enabled).toBe(true);
      expect(disableAction(disabled).enabled).toBe(false);
    });
  });
});
