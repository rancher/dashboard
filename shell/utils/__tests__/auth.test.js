import { isLocalUser } from '@shell/utils/auth';

describe('isLocalUser', () => {
  it('should return true for a local user', () => {
    const user = { principalIds: ['local://admin'] };

    expect(isLocalUser(user)).toBe(true);
  });

  it('should return true for a user with only system principals', () => {
    const user = { principalIds: ['system://user'] };

    expect(isLocalUser(user)).toBe(true);
  });

  it('should return true for a user with both local and system principals', () => {
    const user = { principalIds: ['local://admin', 'system://user'] };

    expect(isLocalUser(user)).toBe(true);
  });

  it('should return false for an OAuth user', () => {
    const user = { principalIds: ['github_user://12345'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should return false for a SAML user', () => {
    const user = { principalIds: ['keycloak_saml://user@example.com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should return false for an LDAP user', () => {
    const user = { principalIds: ['openldap_user://cn=user,dc=example,dc=com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should return false for a user with mixed local and external principals', () => {
    const user = { principalIds: ['local://admin', 'github_user://12345'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should return true for a user with no principals', () => {
    const user = { principalIds: [] };

    expect(isLocalUser(user)).toBe(true);
  });

  it('should return true for a user object without principalIds property', () => {
    const user = {};

    expect(isLocalUser(user)).toBe(true);
  });

  it('should return true for null user', () => {
    expect(isLocalUser(null)).toBe(true);
  });

  it('should return true for undefined user', () => {
    expect(isLocalUser(undefined)).toBe(true);
  });

  it('should handle Azure AD users correctly', () => {
    const user = { principalIds: ['azuread_user://user@example.com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should handle Google OAuth users correctly', () => {
    const user = { principalIds: ['googleoauth_user://user@gmail.com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should handle OIDC users correctly', () => {
    const user = { principalIds: ['oidc_user://user@example.com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should handle ActiveDirectory users correctly', () => {
    const user = { principalIds: ['activedirectory_user://CN=User,DC=example,DC=com'] };

    expect(isLocalUser(user)).toBe(false);
  });

  it('should handle principal with colon but different format', () => {
    // Edge case: principal with colon
    const user = { principalIds: ['local:admin'] };

    expect(isLocalUser(user)).toBe(true);
  });

  it('should handle multiple external auth providers', () => {
    const user = { principalIds: ['github_user://123', 'googleoauth_user://user@gmail.com'] };

    expect(isLocalUser(user)).toBe(false);
  });
});
