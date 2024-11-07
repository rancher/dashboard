import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AzureadPo from '@/cypress/e2e/po/edit/auth/azuread.po';
import AuthProviderPo from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

const authProviderPo = new AuthProviderPo('local');
const azureadPo = new AzureadPo('local');

const tenantId = '564b6f53-ebf4-43c3-8077-44c56a44990a';
const applicationId = '18cca356-170e-4bd9-a4a4-2e349855f96b';
const appSecret = 'test';
const groupMembershipFilter = 'test';
// const defaultEndpoint = 'https://login.microsoftonline.com/';
// const defaultAuthEndpoint = 'https://login.microsoftonline.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/authorize';
// const defaultTokenEndpoint = 'https://login.microsoftonline.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/token';
// const defaultGraphEndpoint = 'https://graph.microsoft.com';
const endpoint = 'https://login.test.com/';
const authEndpoint = 'https://login.test.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/authorize';
const tokenEndpoint = 'https://login.test.com/564b6f53-ebf4-43c3-8077-44c56a44990a/oauth2/v2.0/token';
const graphEndpoint = 'https://graph.test.com';

const mockStatusCode = 200;
const mockBody = {};

describe('AzureAD', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForPage();
    authProviderPo.selectAzureAd();
    azureadPo.waitForPage();
  });

  it('can navigate Auth Provider and select AzureAD', () => {
    azureadPo.mastheadTitle().should('include', `AzureAD`);
  });

  // it.skip('[Vue3 Skip]: sends correct request to create standard Azure AD', () => {
  //   cy.intercept('POST', 'v3/azureADConfigs/azuread?action=configureTest', (req) => {
  //     expect(req.body.tenantId).to.equal(tenantId);
  //     expect(req.body.applicationId).to.equal(applicationId);
  //     expect(req.body.applicationSecret).to.equal(appSecret);
  //     expect(req.body.endpoint).to.equal(defaultEndpoint);
  //     expect(req.body.authEndpoint).to.equal(defaultAuthEndpoint);
  //     expect(req.body.tokenEndpoint).to.equal(defaultTokenEndpoint);
  //     expect(req.body.graphEndpoint).to.equal(defaultGraphEndpoint);

  //     req.reply(mockStatusCode, mockBody);
  //   }).as('configureTest');

  //   // save should be disabled before values are filled
  //   azureadPo.saveButton().expectToBeDisabled();
  //   azureadPo.enterTenantId(tenantId);
  //   azureadPo.enterApplicationId(applicationId);
  //   azureadPo.enterApplicationSecret(appSecret);
  //   // save should be enabled after values are filled
  //   azureadPo.saveButton().expectToBeEnabled();
  //   azureadPo.save();
  //   cy.wait('@configureTest');
  // });

  it('sends correct request to create custom Azure AD', () => {
    cy.intercept('POST', 'v3/azureADConfigs/azuread?action=configureTest', (req) => {
      expect(req.body.tenantId).to.equal(tenantId);
      expect(req.body.applicationId).to.equal(applicationId);
      expect(req.body.applicationSecret).to.equal(appSecret);
      expect(req.body.groupMembershipFilter).to.equal(groupMembershipFilter);
      expect(req.body.endpoint).to.equal(endpoint);
      expect(req.body.authEndpoint).to.equal(authEndpoint);
      expect(req.body.tokenEndpoint).to.equal(tokenEndpoint);
      expect(req.body.graphEndpoint).to.equal(graphEndpoint);

      req.reply(mockStatusCode, mockBody);
    }).as('configureTest');

    // save should be disabled before values are filled
    azureadPo.saveButton().expectToBeDisabled();
    azureadPo.enterTenantId(tenantId);
    azureadPo.enterApplicationId(applicationId);
    azureadPo.enterApplicationSecret(appSecret);

    // enable group membership filter and add a text as filter
    azureadPo.groupMembershipFilterCheckbox().set();
    azureadPo.enterGroupMembershipFilter(groupMembershipFilter);

    azureadPo.selectEndpointsOption(2);

    azureadPo.enterEndpoint(endpoint);
    azureadPo.enterTokenEndpoint(tokenEndpoint);
    azureadPo.enterGraphEndpoint(graphEndpoint);
    azureadPo.enterAuthEndpoint(authEndpoint);

    // save should be enabled after values are filled
    azureadPo.saveButton().expectToBeEnabled();
    azureadPo.save();
    cy.wait('@configureTest');
  });
});
