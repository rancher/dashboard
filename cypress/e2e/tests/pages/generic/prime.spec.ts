import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AuthProviderPo from '@/cypress/e2e/po/pages/users-and-auth/authProvider.po';
import AzureadPo from '@/cypress/e2e/po/edit/auth/azuread.po';

const homePage = new HomePagePo();
const PRIME_DOCS_BASE = 'https://documentation.suse.com/cloudnative/rancher-manager/';

function interceptVersionAndSetToPrime() {
  return cy.intercept('GET', '/rancherversion', {
    statusCode: 200,
    body:       {
      Version:      '9bf6631da',
      GitCommit:    '9bf6631da',
      RancherPrime: 'true'
    }
  });
}

describe('Prime Extension', { testIsolation: 'off', tags: ['@generic', '@adminUser'] }, () => {
  const authProviderPo = new AuthProviderPo('local');
  const azureadPo = new AzureadPo('local');

  before(() => {
    interceptVersionAndSetToPrime().as('rancherVersion');
    cy.login();
    HomePagePo.goTo();
  });

  it('should have prime doc link in the links panel', () => {
    HomePagePo.navTo();
    homePage.waitForPage();
    homePage.supportLinks().eq(0).should('have.attr', 'href').and('satisfy', (href: string) => href.indexOf(PRIME_DOCS_BASE) === 0);
  });

  it('should have prime doc link in a page that renders a doc link from i18n', () => {
    AuthProviderPo.navTo();
    authProviderPo.waitForPage();
    authProviderPo.selectAzureAd();
    azureadPo.waitForPage();

    azureadPo.permissionsWarningBanner().find('A').should('have.attr', 'href').and('satisfy', (href: string) => href.indexOf(PRIME_DOCS_BASE) === 0);
  });
});
