import {
  REMEMBERED_PROVIDER_KEY,
  clearRememberedProviderId,
  getRememberedProviderId,
  resolveInitialProvider,
  setRememberedProviderId,
  toProviderOptions,
} from '@shell/utils/auth-providers';
import type { AuthProviderDriver, AuthProviderOption } from '@shell/utils/auth-providers';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

const labels: Record<string, string> = {
  'model.authConfig.provider."okta"':           'Okta',
  'model.authConfig.provider."github"':         'GitHub',
  'model.authConfig.provider."azuread"':        'Microsoft Entra ID',
  'model.authConfig.provider."activedirectory"': 'ActiveDirectory',
  'model.authConfig.description."saml"':        'SAML',
  'model.authConfig.description."oauth"':       'OAuth',
  'model.authConfig.description."ldap"':        'LDAP',
  'login.providers.local.name':                 'Local account',
  'login.providers.local.meta':                 'Username and password',
};

const i18n = {
  t: (key: string, args?: any) => {
    if (key === 'login.providers.meta') {
      return `${ args.vendor } · ${ args.protocol }`;
    }

    return labels[key] ?? key;
  },
  withFallback: (key: string, _args: object | null, fallback: string) => labels[key] ?? fallback,
};

const driver = (id: string, type: string): AuthProviderDriver => ({ id, type });

const option = (id: string, extra: Partial<AuthProviderOption> = {}): AuthProviderOption => ({
  id,
  type:     'oktaProvider',
  key:      'okta',
  category: 'saml',
  name:     id,
  meta:     'Okta · SAML',
  icon:     '',
  isLocal:  false,
  ...extra,
});

describe('fx: toProviderOptions', () => {
  it('should label a provider with the name the admin chose', () => {
    const [result] = toProviderOptions([driver('Okta — Corporate SSO', 'oktaProvider')], i18n);

    expect(result.name).toBe('Okta — Corporate SSO');
    expect(result.meta).toBe('Okta · SAML');
  });

  // Multi-IDP: two configs of one provider are distinguishable only by name.
  it('should keep configs of the same provider distinct', () => {
    const results = toProviderOptions([
      driver('Okta — Corporate SSO', 'oktaProvider'),
      driver('Okta — Partner tenant', 'oktaProvider'),
    ], i18n);

    expect(results.map((r) => r.name)).toStrictEqual(['Okta — Corporate SSO', 'Okta — Partner tenant']);
    expect(results.map((r) => r.meta)).toStrictEqual(['Okta · SAML', 'Okta · SAML']);
  });

  // Installs predating multi-IDP named their single config after the provider.
  it('should fall back to the vendor label when the name is just the provider key', () => {
    const [result] = toProviderOptions([driver('okta', 'oktaProvider')], i18n);

    expect(result.name).toBe('Okta');
  });

  it('should treat the vendor name case-insensitively when falling back', () => {
    const [result] = toProviderOptions([driver('GitHub', 'githubProvider')], i18n);

    expect(result.name).toBe('GitHub');
  });

  it('should resolve the vendor logo', () => {
    const [result] = toProviderOptions([driver('gh', 'githubProvider')], i18n);

    expect(result.icon).toBe('~shell/assets/images/vendor/github.svg');
  });

  it('should carry the normalised key and protocol category', () => {
    const [result] = toProviderOptions([driver('ad', 'activeDirectoryProvider')], i18n);

    expect(result.key).toBe('activedirectory');
    expect(result.category).toBe('ldap');
    expect(result.meta).toBe('ActiveDirectory · LDAP');
  });

  it('should sort by provider then name so configs of one provider sit together', () => {
    const results = toProviderOptions([
      driver('zeta', 'githubProvider'),
      driver('beta', 'oktaProvider'),
      driver('alpha', 'githubProvider'),
    ], i18n);

    expect(results.map((r) => r.id)).toStrictEqual(['alpha', 'zeta', 'beta']);
  });

  describe('local', () => {
    it('should append local last, after the external providers', () => {
      const results = toProviderOptions([
        driver('local', 'localProvider'),
        driver('gh', 'githubProvider'),
      ], i18n);

      expect(results.map((r) => r.id)).toStrictEqual(['gh', 'local']);
      expect(results[1].isLocal).toBe(true);
    });

    it('should describe local without a vendor', () => {
      const [result] = toProviderOptions([driver('local', 'localProvider')], i18n);

      expect(result.name).toBe('Local account');
      expect(result.meta).toBe('Username and password');
      expect(result.icon).toBe('');
    });

    it('should omit local when it is not configured', () => {
      const results = toProviderOptions([driver('gh', 'githubProvider')], i18n);

      expect(results.some((r) => r.isLocal)).toBe(false);
    });
  });

  it('should return nothing for an empty driver list', () => {
    expect(toProviderOptions([], i18n)).toStrictEqual([]);
  });
});

describe('fx: resolveInitialProvider', () => {
  const options = [option('okta-corp'), option('okta-partner')];

  it('should open on the remembered provider', () => {
    expect(resolveInitialProvider(options, 'okta-partner')?.id).toBe('okta-partner');
  });

  it('should open on the first provider when nothing is remembered', () => {
    expect(resolveInitialProvider(options, null)?.id).toBe('okta-corp');
  });

  // The admin can delete or rename a config out from under a saved choice.
  it('should fall back when the remembered provider no longer exists', () => {
    expect(resolveInitialProvider(options, 'deleted-config')?.id).toBe('okta-corp');
  });

  it('should be undefined when there are no providers at all', () => {
    expect(resolveInitialProvider([], 'okta-corp')).toBeUndefined();
  });
});

describe('remembered provider storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('should round-trip the provider name', () => {
    setRememberedProviderId('okta-corp');

    expect(getRememberedProviderId()).toBe('okta-corp');
    expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBe('okta-corp');
  });

  it('should report nothing when no choice has been saved', () => {
    expect(getRememberedProviderId()).toBeNull();
  });

  it('should forget the saved choice', () => {
    setRememberedProviderId('okta-corp');
    clearRememberedProviderId();

    expect(getRememberedProviderId()).toBeNull();
  });

  // A login page that cannot render is far worse than one that forgets a preference.
  describe('when storage is unavailable', () => {
    const boom = () => {
      throw new Error('QuotaExceededError');
    };

    it('should read as nothing remembered rather than throwing', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(boom);

      expect(getRememberedProviderId()).toBeNull();
    });

    it('should swallow a failed write', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(boom);

      expect(() => setRememberedProviderId('okta-corp')).not.toThrow();
    });

    it('should swallow a failed clear', () => {
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(boom);

      expect(() => clearRememberedProviderId()).not.toThrow();
    });
  });
});
