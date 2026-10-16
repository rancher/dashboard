import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import OpenLdapPo from '@/cypress/e2e/po/edit/auth/openldap.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';
import { interceptAuthConfigCreate, interceptEnabledAuthConfig } from '@/cypress/e2e/blueprints/users/auth-config-stubs';

const authClusterId = '_';
const authProviderPo = new AuthProviderPo(authClusterId);
const openLdapPo = new OpenLdapPo(authClusterId);

const hostname = 'ldap.example.com';
const serviceAccountDn = 'cn=admin,dc=example,dc=com';
const serviceAccountPassword = 'secret';
const userSearchBase = 'dc=example,dc=com';
const userIdAttribute = 'uid';
const groupIdAttribute = 'cn';
const testUsername = 'jdoe';
const testPassword = 'secret';

const mockStatusCode = 200;

const openLdap = {
  name: 'openldap', normanType: 'openLdapConfig', collection: 'openLdapConfigs', actions: ['testAndApply', 'disable']
};

describe('OpenLDAP', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForUrlPathWithoutContext();
    authProviderPo.selectProvider(AuthProvider.OPEN_LDAP);
    openLdapPo.waitForUrlPathWithoutContext();
  });

  it('sends the principal identifier attributes when enabling OpenLDAP', () => {
    interceptAuthConfigCreate(openLdap);

    cy.intercept('POST', 'v3/openLdapConfigs/openldap?action=testAndApply', (req) => {
      expect(req.body.ldapConfig.userIDAttribute).to.equal(userIdAttribute);
      expect(req.body.ldapConfig.groupIDAttribute).to.equal(groupIdAttribute);
      req.reply(mockStatusCode, {});

      return true;
    }).as('testAndApply');

    openLdapPo.saveButton().expectToBeDisabled();

    openLdapPo.enterHostname(hostname);
    openLdapPo.enterServiceAccountDn(serviceAccountDn);
    openLdapPo.enterServiceAccountPassword(serviceAccountPassword);
    openLdapPo.enterUserSearchBase(userSearchBase);
    openLdapPo.userIdAttribute().set(userIdAttribute);
    openLdapPo.groupIdAttribute().set(groupIdAttribute);
    openLdapPo.enterTestUsername(testUsername);
    openLdapPo.enterTestPassword(testPassword);

    openLdapPo.saveButton().expectToBeEnabled();
    openLdapPo.save();
    cy.wait('@testAndApply');
  });

  it('locks the principal identifier attributes once the provider is enabled', () => {
    // Rancher only creates a config once one is added, so an enabled one is stood in
    interceptEnabledAuthConfig(openLdap, {
      servers:          [hostname],
      port:             389,
      userIDAttribute:  userIdAttribute,
      groupIDAttribute: groupIdAttribute,
    });

    OpenLdapPo.goToEditConfig(authClusterId);
    cy.wait('@authConfig');
    openLdapPo.userIdAttribute().self().should('be.disabled');
    openLdapPo.groupIdAttribute().self().should('be.disabled');
  });
});
