import { isLocalPrincipal } from '@shell/utils/auth';

describe('utils/auth: isLocalPrincipal', () => {
  it.each([
    ['local://admin', true],
    ['local://user-628fh', true],
    ['system://user', false],
    ['github_user://12345', false],
    ['githubapp_user://12345', false],
    ['googleoauth_user://user@gmail.com', false],
    ['azuread_user://user@example.com', false],
    ['oidc_user://user@example.com', false],
    ['keycloakoidc_user://user@example.com', false],
    ['saml_user://user', false],
    ['keycloak_saml_user://user@example.com', false],
    ['openldap_user://cn=user,dc=example,dc=com', false],
    ['activedirectory_user://CN=User,DC=example,DC=com', false],
  ])('returns the correct result for principal %p', (principalId, expected) => {
    expect(isLocalPrincipal(principalId)).toStrictEqual(expected);
  });

  it('returns false for non-standard casing', () => {
    expect(isLocalPrincipal('LOCAL://admin')).toStrictEqual(false);
    expect(isLocalPrincipal('Local://admin')).toStrictEqual(false);
  });

  it('returns false for strings without the local:// prefix', () => {
    expect(isLocalPrincipal('local')).toStrictEqual(false);
    expect(isLocalPrincipal('admin')).toStrictEqual(false);
    expect(isLocalPrincipal('')).toStrictEqual(false);
  });

  it('returns false when local:// appears but not as the prefix', () => {
    expect(isLocalPrincipal('notlocal://admin')).toStrictEqual(false);
    expect(isLocalPrincipal('github_user://local://admin')).toStrictEqual(false);
    expect(isLocalPrincipal('prefix-local://user')).toStrictEqual(false);
    expect(isLocalPrincipal('some-local://user-628fh')).toStrictEqual(false);
  });

  it.each([
    [null],
    [undefined],
    [42],
    [{ id: 'local://admin' }],
    [['local://admin']],
  ])('returns false for non-string input %p', (value) => {
    expect(isLocalPrincipal(value as any)).toStrictEqual(false);
  });
});
