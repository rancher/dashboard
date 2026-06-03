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

  it('returns true regardless of casing of the driver prefix', () => {
    expect(isLocalPrincipal('LOCAL://admin')).toStrictEqual(true);
    expect(isLocalPrincipal('Local://admin')).toStrictEqual(true);
  });

  it('returns false for malformed principals without a colon separator', () => {
    expect(isLocalPrincipal('local')).toStrictEqual(false);
    expect(isLocalPrincipal('admin')).toStrictEqual(false);
    expect(isLocalPrincipal('')).toStrictEqual(false);
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
