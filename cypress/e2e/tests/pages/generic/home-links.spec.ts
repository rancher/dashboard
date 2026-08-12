import { RANCHER_PAGE_EXCEPTIONS, SUSE_PAGE_EXCEPTIONS, catchTargetPageException } from '@/cypress/support/utils/exception-utils';
import { qase } from '@/cypress/support/qase';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

// Hosts serving the third party scripts on the suse.com pages, taken from the CI stack traces:
// siteintercept.qualtrics.com (jobs 94098082984, 94166365373) and cdn.vector.co (jobs 94244991845,
// 94090691278).
const SUSE_PAGE_HOSTS = ['suse.com', 'qualtrics.com', 'vector.co'];

describe('Home Page Support Links', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  const homePage = new HomePagePo();

  /**
   * The suse.com pages this spec clicks through to run two third party scripts that reject
   * asynchronously and late. `catchTargetPageException` handles the ones that arrive through the
   * `cy.origin` bridge during a test, but not the ones that arrive after the test body, in an
   * `after each` hook - and a failing hook is not retried, it skips the rest of the spec (CI jobs
   * 94098082984 and 94166365373 both died that way, 5 passing / 1 failing, no second attempt).
   *
   * Those arrive in the primary context, so they need a handler here as well. Both placements are
   * required, not one or the other: under this repo's `chromeWebSecurity: false`
   * (cypress/base-config.ts) neither alone suppresses the late rejection.
   *
   * Unlike the `cy.origin` scoped handler, which structurally cannot see dashboard pages, this one
   * runs on our own origin for the whole spec. So it matches on two things: the message must be one
   * of `SUSE_PAGE_EXCEPTIONS` (never the wider `RANCHER_PAGE_EXCEPTIONS` list) AND the throwing
   * frame must belong to one of `SUSE_PAGE_HOSTS`. Without that second test it would also swallow a
   * dashboard error that happened to contain one of the strings.
   *
   * The host test is fail closed: a future third party script served from a host not listed above
   * would not be matched and this spec would fail the way it does today. If a CI run shows an
   * `after each` hook failure here again, drop the host test and match on the message alone - that
   * is the weaker but more permissive form, and it still fixes the failures we have seen.
   */
  before(() => {
    Cypress.on('uncaught:exception', (err) => {
      const fromThirdParty = SUSE_PAGE_HOSTS.some((host) => (err.stack || '').includes(host));

      if (fromThirdParty && SUSE_PAGE_EXCEPTIONS.some((message) => err.message.includes(message))) {
        return false;
      }
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
    // Pin the destination here rather than in the assertion after the click. github.com decides
    // whether an anonymous visitor gets the new issue form or is bounced to /login, and it stopped
    // bouncing them, so the old `github.com/login` assertion is now wrong - and it would also have
    // been satisfied by any other authenticated github URL the link might wrongly point at.
    homePage.supportLinks().eq(3).should('have.attr', 'href')
      .and('include', 'github.com/rancher/dashboard/issues/new');

    // click File an Issue link
    homePage.clickSupportLink(3, true);

    cy.origin('https://github.com', () => {
      cy.url().should('include', 'github.com/');
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
    cy.origin('https://www.suse.com', () => {
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
