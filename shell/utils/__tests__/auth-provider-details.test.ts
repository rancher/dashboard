import { authProviderDetails } from '@shell/utils/auth-provider-details';

// The keys stand in for the copy, so a test can name the pair it expects
const t = (key: string) => key;

const labels = (config: any, name = 'Provider') => authProviderDetails(config, t, name).map((d) => d.label);

const valueOf = (config: any, label: string, name = 'Provider') => authProviderDetails(config, t, name).find((d) => d.label === label)?.value;

describe('fx: authProviderDetails', () => {
  it.each([
    ['nothing at all', undefined],
    ['null', null],
    ['a config with no provider', { clientId: 'abc' }],
  ])('should show nothing for %s', (_label, config) => {
    expect(authProviderDetails(config as any, t)).toStrictEqual([]);
  });

  // The categories are what the list groups providers by, so the drawer names
  // the same one
  it.each([
    ['github', 'model.authConfig.description.oauth'],
    ['openldap', 'model.authConfig.description.ldap'],
    ['okta', 'model.authConfig.description.saml'],
    ['keycloakoidc', 'model.authConfig.description.oidc'],
  ])('should lead with the kind of provider %s is', (id, expected) => {
    expect(valueOf({ id }, 'authConfig.access.type')).toBe(expected);
  });

  it('should show nothing for a provider it does not know', () => {
    expect(authProviderDetails({ id: 'somethingelse' }, t)).toStrictEqual([]);
  });

  // A provider that is half configured would otherwise show empty labels
  it('should leave out a value the provider does not have', () => {
    const details = labels({ id: 'github', clientId: '' });

    expect(details).not.toContain('authConfig.github.table.clientId');
  });

  describe('github', () => {
    it('should show where the server is and which app is asking', () => {
      const config = {
        id: 'github', hostname: 'github.com', tls: true, clientId: 'abc123'
      };

      expect(authProviderDetails(config, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.oauth' },
        { label: 'authConfig.github.table.server', value: 'https://github.com' },
        { label: 'authConfig.github.table.clientId', value: 'abc123' },
      ]);
    });

    it('should show a server that does not use tls as plain http', () => {
      const config = {
        id: 'github', hostname: 'github.internal', tls: false
      };

      expect(valueOf(config, 'authConfig.github.table.server')).toBe('http://github.internal');
    });

    // A GitHub App is set up separately from an OAuth app, so it has copy of its
    // own
    it('should describe a github app in its own words', () => {
      const config = {
        id: 'githubapp', hostname: 'github.com', tls: true
      };

      expect(labels(config)).toContain('authConfig.githubapp.table.server');
    });
  });

  describe('google oauth', () => {
    it('should show the domain it searches and the account it searches with', () => {
      const config = {
        id:                           'googleoauth',
        adminEmail:                   'admin@example.com',
        hostname:                     'example.com',
        nestedGroupMembershipEnabled: true,
      };

      expect(authProviderDetails(config, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.oauth' },
        { label: 'authConfig.googleoauth.adminEmail', value: 'admin@example.com' },
        { label: 'authConfig.googleoauth.domain', value: 'example.com' },
        { label: 'authConfig.ldap.nestedGroupMembership.label', value: 'generic.enabled' },
      ]);
    });

    // Off is as worth saying as on, so the pair stays
    it('should say when nested groups are not searched', () => {
      const config = { id: 'googleoauth', nestedGroupMembershipEnabled: false };

      expect(valueOf(config, 'authConfig.ldap.nestedGroupMembership.label')).toBe('generic.disabled');
    });
  });

  describe('ldap', () => {
    it('should show the directory and the account that reads it', () => {
      const config = {
        id:                              'openldap',
        servers:                         ['ldap.example.com'],
        port:                            636,
        serviceAccountDistinguishedName: 'cn=admin,dc=example,dc=com',
      };

      expect(authProviderDetails(config, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.ldap' },
        { label: 'authConfig.ldap.table.server', value: 'ldap.example.com:636' },
        { label: 'authConfig.ldap.serviceAccountDN', value: 'cn=admin,dc=example,dc=com' },
      ]);
    });

    // More than one server can answer for the same directory
    it('should show every server the directory is read from', () => {
      const config = {
        id: 'freeipa', servers: ['one.example.com', 'two.example.com'], port: 389
      };

      expect(valueOf(config, 'authConfig.ldap.table.server')).toBe('one.example.com, two.example.com:389');
    });

    it('should show a server that has no port by host alone', () => {
      const config = { id: 'openldap', servers: ['ldap.example.com'] };

      expect(valueOf(config, 'authConfig.ldap.table.server')).toBe('ldap.example.com');
    });

    // Active Directory names the service account rather than its DN
    it('should fall back to the service account username', () => {
      const config = { id: 'activedirectory', serviceAccountUsername: 'rancher' };

      expect(valueOf(config, 'authConfig.ldap.serviceAccountDN')).toBe('rancher');
    });
  });

  describe('saml', () => {
    const saml = {
      id:               'okta',
      entityID:         'https://rancher.example.com',
      rancherApiHost:   'https://rancher.example.com',
      displayNameField: 'displayName',
      userNameField:    'userName',
      uidField:         'uid',
      groupsField:      'groups',
    };

    it('should show how the provider is identified and which fields are read', () => {
      expect(authProviderDetails(saml, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.saml' },
        { label: 'authConfig.saml.entityID', value: 'https://rancher.example.com' },
        { label: 'authConfig.saml.api', value: 'https://rancher.example.com' },
        { label: 'authConfig.saml.displayName', value: 'displayName' },
        { label: 'authConfig.saml.userName', value: 'userName' },
        { label: 'authConfig.saml.UID', value: 'uid' },
        { label: 'authConfig.saml.groups', value: 'groups' },
      ]);
    });

    // A named vendor is set up for the protocol it speaks, only a generic
    // provider is configured with these
    it('should leave the generic settings out of a vendor provider', () => {
      expect(labels(saml)).not.toContain('authConfig.saml.forceAuthn');
    });

    it('should show the generic settings of a generic provider', () => {
      const config = {
        ...saml,
        id:                'genericsaml',
        nameIDFormat:      'emailAddress',
        signatureMethod:   'RSA-SHA256',
        allowIdpInitiated: true,
        forceAuthn:        false,
      };

      const details = authProviderDetails(config, t);

      expect(details).toContainEqual({ label: 'authConfig.saml.nameIDFormat', value: 'authConfig.saml.nameIDFormatOptions.emailAddress' });
      expect(details).toContainEqual({ label: 'authConfig.saml.signatureMethod', value: 'RSA-SHA256' });
      expect(details).toContainEqual({ label: 'authConfig.saml.allowIdpInitiated', value: 'generic.enabled' });
      expect(details).toContainEqual({ label: 'authConfig.saml.forceAuthn', value: 'generic.disabled' });
    });
  });

  describe('oidc', () => {
    it('should show the client and the issuer it trusts', () => {
      const config = {
        id:         'keycloakoidc',
        rancherUrl: 'https://rancher.example.com/verify-auth',
        clientId:   'rancher',
        issuer:     'https://keycloak.example.com/realms/rancher',
      };

      expect(authProviderDetails(config, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.oidc' },
        { label: 'authConfig.oidc.rancherUrl', value: 'https://rancher.example.com/verify-auth' },
        { label: 'authConfig.oidc.clientId', value: 'rancher' },
        { label: 'authConfig.oidc.issuer', value: 'https://keycloak.example.com/realms/rancher' },
      ]);
    });

    it('should show the endpoints and pkce method when they are set', () => {
      const config = {
        id: 'cognito', authEndpoint: 'https://cognito.example.com/authorize', pkceMethod: 'S256'
      };

      expect(labels(config)).toStrictEqual([
        'authConfig.access.type',
        'authConfig.oidc.authEndpoint',
        'authConfig.oidc.pkceMethod.label',
      ]);
    });
  });

  describe('azure ad', () => {
    it('should show the tenant, the application and the endpoints it calls', () => {
      const config = {
        id:            'azuread',
        tenantId:      'tenant-uuid',
        applicationId: 'application-uuid',
        endpoint:      'https://login.microsoftonline.com/',
        graphEndpoint: 'https://graph.microsoft.com',
        tokenEndpoint: 'https://login.microsoftonline.com/tenant-uuid/oauth2/v2.0/token',
        authEndpoint:  'https://login.microsoftonline.com/tenant-uuid/oauth2/v2.0/authorize',
      };

      expect(authProviderDetails(config, t)).toStrictEqual([
        { label: 'authConfig.access.type', value: 'model.authConfig.description.oauth' },
        { label: 'authConfig.azuread.tenantId.label', value: 'tenant-uuid' },
        { label: 'authConfig.azuread.applicationId.label', value: 'application-uuid' },
        { label: 'authConfig.azuread.endpoint.label', value: 'https://login.microsoftonline.com/' },
        { label: 'authConfig.azuread.graphEndpoint.label', value: 'https://graph.microsoft.com' },
        { label: 'authConfig.azuread.tokenEndpoint.label', value: 'https://login.microsoftonline.com/tenant-uuid/oauth2/v2.0/token' },
        { label: 'authConfig.azuread.authEndpoint.label', value: 'https://login.microsoftonline.com/tenant-uuid/oauth2/v2.0/authorize' },
      ]);
    });
  });

  describe('logging out', () => {
    // Only some providers can end the session they hold, and the rest should not
    // claim anything either way
    it('should say nothing about logging out of a provider that cannot', () => {
      const config = { id: 'okta', entityID: 'https://rancher.example.com' };

      expect(labels(config)).not.toContain('authConfig.slo.sloTitle');
    });

    it.each([
      ['only rancher', { logoutAllEnabled: false }, 'authConfig.slo.sloOptions.onlyRancher'],
      ['the provider too', { logoutAllEnabled: true, logoutAllForced: true }, 'authConfig.slo.sloOptions.logoutAll'],
      ['whichever the user picks', { logoutAllEnabled: true, logoutAllForced: false }, 'authConfig.slo.sloOptions.choose'],
    ])('should say a log out ends %s', (_label, slo, expected) => {
      const config = {
        id: 'keycloakoidc', logoutAllSupported: true, ...slo
      };

      expect(valueOf(config, 'authConfig.slo.sloTitle')).toBe(expected);
    });

    // The endpoint is only asked for, and only used, when the provider is logged
    // out of as well
    it('should show the end session endpoint once the provider is logged out of', () => {
      const config = {
        id: 'azuread', logoutAllSupported: true, logoutAllEnabled: true, logoutAllForced: true, endSessionEndpoint: 'https://login.microsoftonline.com/logout',
      };

      expect(valueOf(config, 'authConfig.azuread.endSessionEndpoint.title')).toBe('https://login.microsoftonline.com/logout');
    });

    it('should leave out an end session endpoint that is never called', () => {
      const config = {
        id: 'azuread', logoutAllSupported: true, logoutAllEnabled: false, endSessionEndpoint: 'https://login.microsoftonline.com/logout',
      };

      expect(labels(config)).not.toContain('authConfig.azuread.endSessionEndpoint.title');
    });
  });
});
