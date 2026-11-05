import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import { qase } from '@/cypress/support/qase';

const aboutPage = new AboutPagePo();

describe('About Page', { testIsolation: true, tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  qase(1521, it('can navigate to About page', () => {
    HomePagePo.goToAndWaitForGet();
    AboutPagePo.navTo();
    aboutPage.waitForPage();
  }));

  qase(8584, it('no Prime info when community', { tags: '@noPrime' }, () => {
    aboutPage.goTo();
    aboutPage.waitForPage();
    aboutPage.rancherPrimeInfo().should('not.exist');
  }));

  qase(1519, it('can navigate to Diagnostics page', () => {
    aboutPage.goTo();
    aboutPage.waitForPage();
    aboutPage.diagnosticsBtn().click();

    const diagnosticsPo = new DiagnosticsPagePo();

    diagnosticsPo.waitForPage();
  }));

  qase(1520, it('can View release notes', () => {
    aboutPage.goTo();
    aboutPage.waitForPage();
    cy.getRancherVersion().then((version) => {
      const isPrime = version.RancherPrime === 'true';
      const expectedOrigin = isPrime ? 'https://documentation.suse.com' : 'https://github.com';
      const expectedUrlPattern = isPrime ? '/cloudnative/rancher-manager/.+/en/release-notes' : '/rancher/rancher/releases/tag/';

      aboutPage.clickVersionLink('View release notes');
      cy.origin(expectedOrigin, { args: { expectedUrlPattern } }, ({ expectedUrlPattern }) => {
        cy.url().should('match', new RegExp(expectedUrlPattern));
      });
    });
  }));

  describe('Versions', () => {
    beforeEach(() => {
      aboutPage.goTo();
      aboutPage.waitForPage();
    });

    qase(1506, it('can see rancher version', () => {
      // Check Rancher version
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'];

        cy.contains(rancherVersion).should('be.visible');
      });
    }));

    qase(1504, it('can navigate to /rancher/rancher', () => {
      aboutPage.clickVersionLink('Rancher');
      cy.origin('https://github.com', () => {
        cy.url().should('include', 'https://github.com/rancher/rancher');
      });
    }));

    qase(1507, it('can navigate to /rancher/dashboard', () => {
      aboutPage.clickVersionLink('Dashboard');
      cy.origin('https://github.com', () => {
        cy.url().should('include', 'https://github.com/rancher/dashboard');
      });
    }));

    qase(1508, it('can navigate to /rancher/helm', () => {
      aboutPage.clickVersionLink('Helm');
      cy.origin('https://github.com', () => {
        cy.url().should('include', 'https://github.com/rancher/helm');
      });
    }));

    qase(1505, it('can navigate to /rancher/machine', () => {
      aboutPage.clickVersionLink('Machine');
      cy.origin('https://github.com', () => {
        cy.url().should('include', 'https://github.com/rancher/machine');
      });
    }));
  });

  it('links to the Rancher CLI documentation instead of CLI binaries', () => {
    aboutPage.goTo();
    aboutPage.waitForPage();

    aboutPage.cliDocsLink()
      .should('have.attr', 'href')
      .and('include', '/reference-guides/cli-with-rancher/rancher-cli');
    aboutPage.self().find('a[href*="releases.rancher.com/cli2"]').should('not.exist');
  });

  describe('Rancher Prime', { tags: '@prime' }, () => {
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

    beforeEach(() => {
      interceptVersionAndSetToPrime().as('rancherVersion');
    });

    qase(11248, it('should show prime panel on about page', () => {
      HomePagePo.goToAndWaitForGet();

      AboutPagePo.navTo();
      aboutPage.waitForPage();

      // Wait for the intercepted rancherversion request to complete
      cy.wait('@rancherVersion');

      aboutPage.rancherPrimeInfo().should('exist');
    }));
  });
});
