import AuthConfig, { configTypeForProvider, providerKey } from '@shell/models/management.cattle.io.authconfig';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

// Stands in for i18n, echoing the key back so tests can assert on which key was looked up.
const rootGetters = { 'i18n/withFallback': (key: string) => key };

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

describe('class AuthConfig', () => {
  describe('configType', () => {
    // Steve renames the stored `type` field to `_type`, because its own `type` is
    // always `management.cattle.io.authconfig` for every one of these resources.
    it('should derive the category from _type, not the Steve type', () => {
      const config = makeConfig({
        id: 'github', _type: 'githubConfig', type: 'management.cattle.io.authconfig'
      });

      expect(config.configType).toBe('oauth');
    });

    it.each([
      ['activeDirectoryConfig', 'ldap'],
      ['azureADConfig', 'oauth'],
      ['oidcConfig', 'oidc'],
      ['genericSAMLConfig', 'saml'],
    ])('should map _type %p to %p', (_type: string, expected: string) => {
      expect(makeConfig({ _type }).configType).toBe(expected);
    });

    it('should be undefined for an unrecognised _type', () => {
      expect(makeConfig({ _type: 'somethingElseConfig' }).configType).toBeUndefined();
    });
  });

  describe('provider', () => {
    // Multi-IDP: several configs of one provider, each with its own arbitrary name.
    it('should resolve every config of a provider to the same label', () => {
      const first = makeConfig({ id: 'github', _type: 'githubConfig' });
      const second = makeConfig({ id: 'github-two', _type: 'githubConfig' });

      expect(second.provider).toBe(first.provider);
      expect(second.provider).toContain('provider."github"');
    });

    it('should not key the label off the instance name', () => {
      const config = makeConfig({ id: 'github-two', _type: 'githubConfig' });

      expect(config.provider).not.toContain('github-two');
    });
  });

  describe('icon', () => {
    it.each([
      ['githubConfig', 'github'],
      ['activeDirectoryConfig', 'activedirectory'],
      ['freeIpaConfig', 'freeipa'],
    ])('should derive the asset name from _type %p', (_type: string, expected: string) => {
      expect(makeConfig({ _type }).icon).toBe(`~shell/assets/images/vendor/${ expected }.svg`);
    });

    it.each([
      ['azureADConfig', 'entraid'],
      ['genericOIDCConfig', 'openid'],
      ['keyCloakOIDCConfig', 'keycloak'],
    ])('should apply the override for _type %p', (_type: string, expected: string) => {
      expect(makeConfig({ _type }).icon).toBe(`~shell/assets/images/vendor/${ expected }.svg`);
    });

    it('should use the same asset for every config of a provider', () => {
      const first = makeConfig({ id: 'github', _type: 'githubConfig' });
      const second = makeConfig({ id: 'github-two', _type: 'githubConfig' });

      expect(second.icon).toBe(first.icon);
    });
  });
});
