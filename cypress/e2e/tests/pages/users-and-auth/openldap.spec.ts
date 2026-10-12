import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import OpenLdapPo from '@/cypress/e2e/po/edit/auth/openldap.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

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
    // Patch the real config so the page gets every field it expects, only marked as enabled
    cy.intercept('GET', 'v3/authconfig/openldap', (req) => {
      req.continue((res) => {
        res.body.enabled = true;
        res.body.servers = [hostname];
        res.body.userIDAttribute = userIdAttribute;
        res.body.groupIDAttribute = groupIdAttribute;
      });
    }).as('authConfig');

    OpenLdapPo.goToEditConfig(authClusterId);
    cy.wait('@authConfig');
    openLdapPo.userIdAttribute().self().should('be.disabled');
    openLdapPo.groupIdAttribute().self().should('be.disabled');
  });
});
