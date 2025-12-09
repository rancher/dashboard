import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AmazonCognitoPo from '@/cypress/e2e/po/edit/auth/cognito.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

const authClusterId = '_';
const authProviderPo = new AuthProviderPo(authClusterId);
const cognitoPo = new AmazonCognitoPo(authClusterId);

const clientId = 'test-client-id';
const clientSecret = 'test-client-secret';
const issuerUrl = 'test-issuer-url';
const defaultScope = 'openid email';

const mockStatusCode = 200;
const mockBody = {};

describe('Amazon Cognito', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForUrlPathWithoutContext();
    authProviderPo.selectProvider(AuthProvider.AMAZON_COGNITO);
    cognitoPo.waitForUrlPathWithoutContext();
  });

  it('can navigate Auth Provider and select Amazon Cognito', () => {
    cognitoPo.mastheadTitle().should('include', `Amazon Cognito`);

    cognitoPo.cognitoBanner().should('be.visible');
    cognitoPo.permissionsWarningBanner().should('be.visible');
  });

  it('sends correct request to create Amazon Cognito auth provider', () => {
    cy.intercept('POST', 'v3/cognitoConfigs/cognito?action=configureTest', (req) => {
      expect(req.body.enabled).to.equal(false);
      expect(req.body.id).to.equal('cognito');
      expect(req.body.type).to.equal('cognitoConfig');
      expect(req.body.clientId).to.equal(clientId);
      expect(req.body.clientSecret).to.equal(clientSecret);
      expect(req.body.issuer).to.equal(issuerUrl);
      expect(req.body.scope).to.equal(defaultScope);

      req.reply(mockStatusCode, mockBody);

      return true;
    }).as('configureTest');

    // save should be disabled before values are filled
    cognitoPo.saveButton().expectToBeDisabled();
    cognitoPo.enterClientId(clientId);
    cognitoPo.enterClientSecret(clientSecret);
    cognitoPo.enterIssuerUrl(issuerUrl);

    // save should be enabled after values are filled
    cognitoPo.saveButton().expectToBeEnabled();
    cognitoPo.save();
    cy.wait('@configureTest');
  });
});
