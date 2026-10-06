import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import OktaPo from '@/cypress/e2e/po/edit/auth/okta.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

const authClusterId = '_';
const authProviderPo = new AuthProviderPo(authClusterId);
const oktaPo = new OktaPo(authClusterId);

const displayNameField = 'displayName';
const userNameField = 'userName';
const uidField = 'uid';
const groupsField = 'groups';
const rancherApiHost = 'https://rancher.example.com';
const spKey = '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----';
const spCert = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';
const idpMetadata = '<EntityDescriptor/>';

const ldapHostname = 'ldap.example.com';
const serviceAccountDn = 'cn=admin,dc=example,dc=com';
const serviceAccountPassword = 'secret';
const userSearchBase = 'dc=example,dc=com';
const userIdAttribute = 'uid';
const groupIdAttribute = 'cn';

const mockStatusCode = 200;

describe('Okta', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForUrlPathWithoutContext();
    authProviderPo.selectProvider(AuthProvider.OKTA);
    oktaPo.waitForUrlPathWithoutContext();
  });

  it('sends the principal identifier attributes in the LDAP search config when enabling Okta', () => {
    // The SAML enable flow saves the config first, then calls testAndEnable, which is mocked to prevent the IdP redirect
    cy.intercept('PUT', 'v3/oktaConfigs/okta', (req) => {
      expect(req.body.openLdapConfig.userIDAttribute).to.equal(userIdAttribute);
      expect(req.body.openLdapConfig.groupIDAttribute).to.equal(groupIdAttribute);
      req.reply(mockStatusCode, { type: 'oktaConfig', id: 'okta' });

      return true;
    }).as('saveConfig');

    cy.intercept('POST', 'v3/oktaConfigs/okta?action=testAndEnable', (req) => {
      req.reply(mockStatusCode, { idpRedirectUrl: 'https://example.com' });

      return true;
    }).as('testAndEnable');

    oktaPo.enterDisplayName(displayNameField);
    oktaPo.enterUserName(userNameField);
    oktaPo.enterUid(uidField);
    oktaPo.enterGroups(groupsField);
    oktaPo.enterRancherApiHost(rancherApiHost);
    oktaPo.enterKey(spKey);
    oktaPo.enterCert(spCert);
    oktaPo.enterMetadata(idpMetadata);

    oktaPo.showLdap().set();
    oktaPo.enterLdapHostname(ldapHostname);
    oktaPo.enterLdapServiceAccountDn(serviceAccountDn);
    oktaPo.enterLdapServiceAccountPassword(serviceAccountPassword);
    oktaPo.enterLdapUserSearchBase(userSearchBase);
    oktaPo.userIdAttribute().set(userIdAttribute);
    oktaPo.groupIdAttribute().set(groupIdAttribute);

    oktaPo.saveButton().expectToBeEnabled();
    oktaPo.save();
    cy.wait('@saveConfig');
    cy.wait('@testAndEnable');
  });

  it('keeps the principal identifier attributes editable once Okta is enabled', () => {
    cy.intercept('GET', 'v3/authConfigs/okta', (req) => {
      req.reply(mockStatusCode, {
        type:           'oktaConfig',
        id:             'okta',
        enabled:        true,
        displayNameField,
        userNameField,
        uidField,
        groupsField,
        rancherApiHost,
        openLdapConfig: {
          servers:          [ldapHostname],
          port:             389,
          userSearchBase,
          userIDAttribute:  userIdAttribute,
          groupIDAttribute: groupIdAttribute,
        },
      });
    }).as('authConfig');

    OktaPo.goToEditConfig(authClusterId);
    cy.wait('@authConfig');
    oktaPo.userIdAttribute().self().should('be.enabled');
    oktaPo.groupIdAttribute().self().should('be.enabled');
    oktaPo.userIdAttribute().value().should('equal', userIdAttribute);
    oktaPo.groupIdAttribute().value().should('equal', groupIdAttribute);
  });
});
