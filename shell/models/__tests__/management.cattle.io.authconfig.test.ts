import { configTypeForProvider, providerIcon, providerKey } from '@shell/models/management.cattle.io.authconfig';
import { requireAsset } from '@shell/utils/require-asset';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

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
