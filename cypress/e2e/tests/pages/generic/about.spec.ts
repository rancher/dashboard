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

  qase(1520, it('renders a link to the release notes', () => {
    aboutPage.goTo();
    aboutPage.waitForPage();
    cy.getRancherVersion().then((version) => {
      const isPrime = version.RancherPrime === 'true';
      // Assert the link the dashboard renders instead of following it to the external site. The
      // site's availability and its redirects are not ours: following it lands on
      // chrome-error://chromewebdata/ when the runner cannot reach github.com, and for a dev build
      // the dashboard links to `releases/latest` (see getReleaseNotesURL in shell/utils/version.js)
      // so the old `/releases/tag/` expectation only held while github.com chose to redirect.
      //
      // The community pattern accepts both shapes rather than deriving which one to expect. That is
      // deliberate: picking the shape here would restate `isDevBuild` in the test, and
      // shell/utils/__tests__/version.test.ts already covers every dev/release/prime branch of
      // getReleaseNotesURL exhaustively, so the choice is not left untested.
      const expectedUrlPattern = isPrime ? '/cloudnative/rancher-manager/.+/en/release-notes' : '/rancher/rancher/releases/(latest|tag/v.+)';

      aboutPage.links('View release notes').should('have.attr', 'target');
      aboutPage.getLinkDestination('View release notes').should('match', new RegExp(expectedUrlPattern));
    });
  }));

  describe('Versions', () => {
    beforeEach(() => {
      aboutPage.goTo();
      aboutPage.waitForPage();
    });

    // These links are static hrefs rendered by shell/pages/about.vue, so the href and the `target`
    // that opens it in a new tab are the whole of the dashboard's behaviour here. Loading
    // github.com from a CI runner is not, and when it fails the assertion sees
    // chrome-error://chromewebdata/ on every retry.
    const checkVersionLink = (label: string, expectedUrl: string) => {
      aboutPage.links(label).should('have.attr', 'target');
      aboutPage.getLinkDestination(label).should('include', expectedUrl);
    };

    qase(1506, it('can see rancher version', () => {
      // Check Rancher version
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'];

        cy.contains(rancherVersion).should('be.visible');
      });
    }));

    qase(1504, it('renders a link to /rancher/rancher', () => {
      checkVersionLink('Rancher', 'https://github.com/rancher/rancher');
    }));

    qase(1507, it('renders a link to /rancher/dashboard', () => {
      checkVersionLink('Dashboard', 'https://github.com/rancher/dashboard');
    }));

    qase(1508, it('renders a link to /rancher/helm', () => {
      checkVersionLink('Helm', 'https://github.com/rancher/helm');
    }));

    qase(1505, it('renders a link to /rancher/machine', () => {
      checkVersionLink('Machine', 'https://github.com/rancher/machine');
    }));
  });

  describe('CLI Downloads', () => {
    // Shouldn't be needed with https://github.com/rancher/dashboard/issues/11393
    const expectedLinkStatusCode = 200;

    // workaround to make the following CLI tests work https://github.com/cypress-io/cypress/issues/8089#issuecomment-1585159023
    beforeEach(() => {
      aboutPage.goTo();
      aboutPage.waitForPage();
      cy.intercept('GET', 'https://releases.rancher.com/cli2/**').as('download');
    });

    qase(1450, it('can download macOS CLI', () => {
      aboutPage.getLinkDestination('rancher-darwin').then((el) => {
        const macOsVersion = el.split('/')[5];

        aboutPage.getCliDownloadLinkByLabel('rancher-darwin').then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(expectedLinkStatusCode);
          expect(request.url).includes(macOsVersion);
        });
      });
    }));

    qase(1451, it('can download Linux CLI', () => {
      aboutPage.getLinkDestination('rancher-linux').then((el) => {
        const linuxVersion = el.split('/')[5];

        aboutPage.getCliDownloadLinkByLabel('rancher-linux').then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(expectedLinkStatusCode);
          expect(request.url).includes(linuxVersion);
        });
      });
    }));

    qase(1449, it('can download Windows CLI', () => {
      aboutPage.getLinkDestination('rancher-windows').then((el) => {
        const windowsVersion = el.split('/')[5];

        aboutPage.getCliDownloadLinkByLabel('rancher-windows').then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(expectedLinkStatusCode);
          expect(request.url).includes(windowsVersion);
        });
      });
    }));
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
