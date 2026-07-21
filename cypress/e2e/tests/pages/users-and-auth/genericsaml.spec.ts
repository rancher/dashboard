import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import GenericSamlPo from '@/cypress/e2e/po/edit/auth/saml.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

const authClusterId = '_';
const authProviderPo = new AuthProviderPo(authClusterId);
const genericSamlPo = new GenericSamlPo(authClusterId);

const displayNameField = 'sAMAccountName';
const userNameField = 'sAMAccountName';
const uidField = 'objectGUID';
const groupsField = 'memberOf';
const rancherApiHost = 'https://rancher.example.com';
const spKey = '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----';
const spCert = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';
const idpMetadata = '<EntityDescriptor/>';

const mockStatusCode = 200;

// SKIPPED pending backend availability. This suite selects the Generic SAML
// provider from the auth-config grid, which is populated from the backend. The
// dashboard e2e runs against a released Rancher that does not yet include the
// generic SAML provider (rancher/rancher#56139), so the tile is absent and
// selection times out. Change `describe.skip` back to `describe` once a Rancher
// image containing the generic SAML provider is used by the e2e job.
describe.skip('Generic SAML', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForUrlPathWithoutContext();
    authProviderPo.selectProvider(AuthProvider.GENERIC_SAML);
    genericSamlPo.waitForUrlPathWithoutContext();
  });

  it('can navigate Auth Provider and select Generic SAML', () => {
    genericSamlPo.mastheadTitle().should('include', 'Generic SAML');
    genericSamlPo.permissionsWarningBanner().should('be.visible');
  });

  it('sends correct request to create Generic SAML auth provider', () => {
    // The SAML enable flow makes two sequential requests:
    // 1. PUT v3/genericSAMLConfigs/genericsaml — saves the full config; assert payload here
    // 2. POST v3/genericSAMLConfigs/genericsaml?action=testAndEnable — triggers IdP redirect; mocked to prevent real redirect
    cy.intercept('PUT', 'v3/genericSAMLConfigs/genericsaml', (req) => {
      expect(req.body.type).to.equal('genericSAMLConfig');
      expect(req.body.displayNameField).to.equal(displayNameField);
      expect(req.body.userNameField).to.equal(userNameField);
      expect(req.body.uidField).to.equal(uidField);
      expect(req.body.groupsField).to.equal(groupsField);
      expect(req.body.nameIDFormat).to.equal('emailAddress');
      expect(req.body.signatureMethod).to.equal('RSA-SHA1');
      expect(req.body.allowIdpInitiated).to.equal(true);
      req.reply(mockStatusCode, { type: 'genericSAMLConfig', id: 'genericsaml' });

      return true;
    }).as('saveConfig');

    cy.intercept('POST', 'v3/genericSAMLConfigs/genericsaml?action=testAndEnable', (req) => {
      req.reply(mockStatusCode, { idpRedirectUrl: 'https://example.com' });

      return true;
    }).as('testAndEnable');

    genericSamlPo.saveButton().expectToBeDisabled();

    genericSamlPo.enterDisplayName(displayNameField);
    genericSamlPo.enterUserName(userNameField);
    genericSamlPo.enterUid(uidField);
    genericSamlPo.enterGroups(groupsField);
    genericSamlPo.enterRancherApiHost(rancherApiHost);
    genericSamlPo.enterKey(spKey);
    genericSamlPo.enterCert(spCert);
    genericSamlPo.enterMetadata(idpMetadata);

    genericSamlPo.nameIdFormat().toggle();
    genericSamlPo.nameIdFormat().clickOptionWithLabel('emailAddress');

    genericSamlPo.signatureAlgorithm().toggle();
    genericSamlPo.signatureAlgorithm().clickOptionWithLabel('RSA-SHA1');

    genericSamlPo.allowIdpInitiated().check();

    genericSamlPo.saveButton().expectToBeEnabled();
    genericSamlPo.save();
    // Wait on the config PUT so its payload assertions actually run, then on the enable POST.
    cy.wait('@saveConfig');
    cy.wait('@testAndEnable');
  });
});
