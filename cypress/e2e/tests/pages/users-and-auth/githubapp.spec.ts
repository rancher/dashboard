import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import GithubAppPo from '@/cypress/e2e/po/edit/auth/githubapp.po';
import { AuthProvider, AuthProviderPo } from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';

const authClusterId = '_';
const authProviderPo = new AuthProviderPo(authClusterId);
const githubAppPo = new GithubAppPo(authClusterId);

const clientId = 'test-client-id';
const clientSecret = 'test-client-secret';
const appId = 'test-app-id';
const privateKey = 'test-private-key';

const mockStatusCode = 200;
const mockBody = {};

describe('GitHub App', { tags: ['@adminUser', '@usersAndAuths'] }, () => {
  beforeEach(() => {
    cy.login();
    HomePagePo.goToAndWaitForGet();
    AuthProviderPo.navTo();
    authProviderPo.waitForUrlPathWithoutContext();
    authProviderPo.selectProvider(AuthProvider.GITHUB_APP);
    githubAppPo.waitForUrlPathWithoutContext();
  });

  it('can navigate to Auth Provider and Select GitHub App', () => {
    githubAppPo.mastheadTitle().should('include', `GitHub App`);

    githubAppPo.gitHubAppBanner().should('be.visible');
    githubAppPo.permissionsWarningBanner().should('be.visible');
  });

  it('sends correct request to create GitHub App auth provider', () => {
    cy.intercept('POST', 'v3/githubAppConfigs/githubapp?action=configureTest', (req) => {
      expect(req.body.enabled).to.equal(false);
      expect(req.body.id).to.equal('githubapp');
      expect(req.body.type).to.equal('githubAppConfig');
      expect(req.body.clientId).to.equal(clientId);
      expect(req.body.clientSecret).to.equal(clientSecret);
      expect(req.body.appId).to.equal(appId);
      expect(req.body.privateKey).to.equal(privateKey);

      req.reply(mockStatusCode, mockBody);

      return true;
    }).as('configureTest');

    // save should be disabled before values are filled
    githubAppPo.saveButton().expectToBeDisabled();
    githubAppPo.enterClientId(clientId);
    githubAppPo.enterClientSecret(clientSecret);
    githubAppPo.enterGitHubAppId(appId);
    githubAppPo.enterPrivateKey(privateKey);

    // save should be enabled after values are filled
    githubAppPo.saveButton().expectToBeEnabled();
    githubAppPo.save();
    cy.wait('@configureTest');
  });
});
