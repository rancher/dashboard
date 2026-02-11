import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SupportPagePo from '@/cypress/e2e/po/pages/get-support.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '~/cypress/support/utils/exception-utils';

const burgerMenu = new BurgerMenuPo();
const supportPage = new SupportPagePo();

describe('Support Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to Support page', { tags: ['@generic', '@adminUser'] }, () => {
    HomePagePo.goToAndWaitForGet();
    SupportPagePo.navTo();
    supportPage.waitForPage();
  });

  it('standard user does not have access to Support page', { tags: ['@generic', '@standardUser'] }, () => {
    HomePagePo.goToAndWaitForGet();
    BurgerMenuPo.toggle();
    burgerMenu.support().should('not.exist');
  });

  describe('Support Links', { tags: ['@generic', '@adminUser'] }, () => {
    // Click the support links and verify user lands on the correct page
    beforeEach(() => {
      supportPage.goTo();
      supportPage.waitForPage();
    });

    it('can click on Suse Rancher Support link', { tags: '@noPrime' }, () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://www.rancher.com/');

      supportPage.clickExternalSupportLinks(0);

      cy.origin('https://www.rancher.com/', () => {
        cy.url().should('include', 'support');
      });
    });

    it('can click on Contact us for pricing link', { tags: '@noPrime' }, () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://www.rancher.com/pricing');

      supportPage.clickExternalSupportLinks(1);

      cy.origin('https://www.rancher.com/pricing', () => {
        cy.url().should('include', 'pricing');
      });
    });

    it('can click on Suse Customer Center link', { tags: ['@jenkins', '@prime'] }, () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://scc.suse.com/');

      supportPage.clickSccLink();

      cy.origin('https://scc.suse.com/', () => {
        cy.url().should('include', 'scc.suse.com/');
      });
    });

    it('can click on Docs link', () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://ranchermanager.docs.rancher.com');

      supportPage.supportLinks().should('have.length.at.least', 5);
      supportPage.clickSupportLink(0, true);

      // Doc link differs between Rancher Prime and Community
      cy.getRancherVersion().then((version) => {
        const expectedOrigin = version.RancherPrime === 'true' ? 'https://documentation.suse.com' : 'https://ranchermanager.docs.rancher.com';
        const expectedUrl = version.RancherPrime === 'true' ? 'documentation.suse.com/cloudnative/rancher-manager' : 'ranchermanager.docs.rancher.com';

        cy.origin(expectedOrigin, { args: { expectedUrl } }, ({ expectedUrl }) => {
          cy.url().should('include', expectedUrl);
        });
      });
    });

    it('can click on Forums link', () => {
      catchTargetPageException('TenantFeatures', 'https://forums.suse.com');

      // click Forums link
      supportPage.clickSupportLink(1, true);

      cy.origin('https://forums.suse.com', () => {
        cy.url().should('include', 'forums.suse.com/');
      });
    });

    it('can click on Slack link', () => {
    // click Slack link
      supportPage.clickSupportLink(2, true);
      cy.origin('https://slack.rancher.io', () => {
        cy.url().should('include', 'slack.rancher.io/');
      });
    });

    it('can click on File an Issue link', () => {
    // click File an Issue link
      supportPage.clickSupportLink(3, true);
      cy.origin('https://github.com', () => {
        cy.url().should('include', 'github.com/login');
      });
    });

    it('can click on Get Started link', () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      // click Get Started link
      supportPage.clickSupportLink(4, true);
      cy.url().should('include', 'getting-started/overview');
    });

    it('can click on SUSE Application Collection link', { tags: ['@jenkins', '@prime'] }, () => {
      catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

      // click SUSE Application Collection link
      supportPage.clickSupportLink(5, true);
      cy.origin('https://apps.rancher.io/', () => {
        cy.url().should('include', 'apps.rancher.io/');
      });
    });
  });
});
