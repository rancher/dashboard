import logout from '@shell/pages/auth/logout.vue';

describe('page: auth/logout', () => {
  const keycloak = {
    id: 'keycloak', type: 'keyCloakProvider', logoutAllSupported: true, logoutAllEnabled: true, logoutAllForced: true
  };
  const openldap = {
    id: 'openldap', type: 'openLdapProvider', logoutAllSupported: false, logoutAllEnabled: false, logoutAllForced: false
  };

  function runFetch(principalId: string | null, authProviders = [keycloak, openldap]) {
    const dispatch = jest.fn((action: string) => Promise.resolve(action === 'auth/getAuthProviders' ? authProviders : undefined));
    const $store = { dispatch, getters: { 'auth/principalId': principalId } };

    return (logout as any).fetch.call({ $store }).then(() => dispatch);
  }

  it('should force single logout for a user of the provider that forces it', async() => {
    const dispatch = await runFetch('keycloak_user://alice@example.com');

    expect(dispatch).toHaveBeenCalledWith('auth/logout', {
      force: true, slo: true, provider: keycloak
    }, { root: true });
  });

  it.each<[string | null, string]>([
    ['openldap_user://uid=alice,ou=people,dc=example', 'a provider without single logout'],
    ['local://u-abc', 'the local provider'],
    [null, 'an unknown provider'],
  ])('should log %s, a user of %s, out of only Rancher', async(principalId) => {
    const dispatch = await runFetch(principalId);

    expect(dispatch).toHaveBeenCalledWith('auth/logout', { force: true }, { root: true });
  });

  it('should log a user out of only Rancher when single logout is not forced', async() => {
    const dispatch = await runFetch('keycloak_user://alice@example.com', [{ ...keycloak, logoutAllForced: false }]);

    expect(dispatch).toHaveBeenCalledWith('auth/logout', { force: true }, { root: true });
  });
});
