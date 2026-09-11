import { RANCHER_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { qase } from '@/cypress/support/qase';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

describe('Home Page Support Links', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  const homePage = new HomePagePo();

  before(() => {
    // The external SUSE / Rancher Prime pages load a third-party telemetry pixel (cdn.vector.co) that
    // asynchronously throws "No visitor ID available. Load may have failed." - often LATE, in the
    // after-all hook, after the per-test catchTargetPageException (cy.on) handler's scope has ended,
    // and Cypress does not retry hook failures. Register a spec-wide global handler so these known
    // third-party errors never fail this spec's hooks; only the known messages are swallowed.
    Cypress.on('uncaught:exception', (err) => {
      if (RANCHER_PAGE_EXCEPTIONS.some((m) => (err?.message || '').includes(m))) {
        return false;
      }

      return undefined;
    });
  });

  // Click the support links and verify user lands on the correct page
  beforeEach(() => {
    cy.login();
    homePage.goTo();
  });

  qase(1477, it('can click on Docs link', () => {
    catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://ranchermanager.docs.rancher.com');

    homePage.supportLinks().should('have.length.at.least', 6);
    homePage.clickSupportLink(0, true);

    // Doc link differs between Rancher Prime and Community
    cy.getRancherVersion().then((version) => {
      const expectedOrigin = version.RancherPrime === 'true' ? 'https://documentation.suse.com' : 'https://ranchermanager.docs.rancher.com';
      const expectedUrl = version.RancherPrime === 'true' ? 'documentation.suse.com/cloudnative/rancher-manager' : 'ranchermanager.docs.rancher.com';

      cy.origin(expectedOrigin, { args: { expectedUrl } }, ({ expectedUrl }) => {
        cy.url().should('include', expectedUrl);
      });
    });
  }));

  qase(1475, it('can click on Forums link', () => {
    catchTargetPageException('TenantFeatures', 'https://forums.suse.com');

    // click Forums link
    homePage.clickSupportLink(1, true);

    cy.origin('https://forums.suse.com', () => {
      cy.url().should('include', 'forums.suse.com/');
    });
  }));

  qase(1474, it('can click on Slack link', () => {
    // click Slack link
    homePage.clickSupportLink(2, true);

    cy.origin('https://slack.rancher.io', () => {
      cy.url().should('include', 'slack.rancher.io/');
    });
  }));

  qase(1478, it('can click on File an Issue link', () => {
    // click File an Issue link
    homePage.clickSupportLink(3, true);

    cy.origin('https://github.com', () => {
      cy.url().should('include', 'github.com/login');
    });
  }));

  qase(1473, it('can click on Get Started link', () => {
    catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

    // click Get Started link
    homePage.clickSupportLink(4, true);

    cy.url().should('include', 'getting-started/overview');
  }));

  qase(1476, it('can click on Rancher Prime link', { tags: '@noPrime' }, () => {
    catchTargetPageException(RANCHER_PAGE_EXCEPTIONS, 'https://www.suse.com');

    // click Rancher Prime link (replaces old Commercial Support link)
    homePage.clickSupportLink(5, true);
    cy.origin('https://www.suse.com', { args: { RANCHER_PAGE_EXCEPTIONS } }, ({ RANCHER_PAGE_EXCEPTIONS }) => {
      // The suse.com telemetry pixel (cdn.vector.co) rejects asynchronously and often LATE - after
      // this test finishes, during the spec's after-all hook. By then the per-test `cy.on` handler
      // registered by catchTargetPageException is already torn down, and Cypress does NOT retry hook
      // failures, so the whole spec fails. `cy.on` scopes to the current test; `Cypress.on` scoped to
      // THIS (suse.com) secondary origin persists for the rest of the spec, so it still swallows the
      // known third-party rejection when it finally fires in the after-all hook. This must live inside
      // cy.origin because the primary-context handler in `before()` does not see secondary-origin errors.
      Cypress.on('uncaught:exception', (err) => {
        if (RANCHER_PAGE_EXCEPTIONS.some((m) => (err?.message || '').includes(m))) {
          return false;
        }

        return undefined;
      });

      cy.url().should('include', 'suse.com/products/rancher');
    });
  }));

  it('can click on SUSE Application Collection link', { tags: ['@jenkins', '@prime', '@scc'] }, () => {
    catchTargetPageException(RANCHER_PAGE_EXCEPTIONS);

    // click SUSE Application Collection link
    homePage.clickSupportLink(5, true);
    cy.origin('https://apps.rancher.io/', () => {
      cy.url().should('include', 'apps.rancher.io/');
    });
  });
});
