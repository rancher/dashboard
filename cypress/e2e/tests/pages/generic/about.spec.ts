import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const aboutPage = new AboutPagePo();
const downloadsFolder = Cypress.config('downloadsFolder');

describe('About Page', { testIsolation: 'off', tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can navigate to About page', () => {
    HomePagePo.goToAndWaitForGet();
    AboutPagePo.navTo();
    aboutPage.waitForPage();
  });

  it('can navigate to Diagnostics page', () => {
    AboutPagePo.navTo();
    aboutPage.waitForPage();
    aboutPage.diagnosticsBtn().click();

    const diagnosticsPo = new DiagnosticsPagePo();

    diagnosticsPo.waitForPage();
  });

  it('can View release notes', () => {
    AboutPagePo.navTo();
    aboutPage.waitForPage();

    aboutPage.clickVersionLink('View release notes');
    cy.origin('https://github.com/rancher/rancher', () => {
      cy.url().should('include', 'https://github.com/rancher/rancher/releases/tag/');
    });
  });

  describe('Versions', () => {
    beforeEach(() => {
      aboutPage.goTo();
    });

    it('can see rancher version', () => {
      // Check Rancher version
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'];

        cy.contains(rancherVersion).should('be.visible');
      });
    });

    it('can navigate to /rancher/rancher', () => {
      aboutPage.clickVersionLink('Rancher');
      cy.origin('https://github.com/rancher/rancher', () => {
        cy.url().should('include', 'https://github.com/rancher/rancher');
      });
    });

    it('can navigate to /rancher/dashboard', () => {
      aboutPage.clickVersionLink('Dashboard');
      cy.origin('https://github.com/rancher/dashboard', () => {
        cy.url().should('include', 'https://github.com/rancher/dashboard');
      });
    });

    it('can navigate to /rancher/helm', () => {
      aboutPage.clickVersionLink('Helm');
      cy.origin('https://github.com/rancher/helm', () => {
        cy.url().should('include', 'https://github.com/rancher/helm');
      });
    });

    it('can navigate to /rancher/machine', () => {
      aboutPage.clickVersionLink('Machine');
      cy.origin('https://github.com/rancher/machine', () => {
        cy.url().should('include', 'https://github.com/rancher/machine');
      });
    });
  });

  describe('Image List', () => {
    before(() => {
      aboutPage.goTo();
    });

    it('can download Linux Image List', () => {
      // Download txt and verify file exists
      const downloadedFilename = path.join(downloadsFolder, 'rancher-linux-images.txt');

      aboutPage.getLinuxDownloadLink().click();

      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'];

        cy.readFile(downloadedFilename).should('contain', rancherVersion);
      });
    });

    it('can download Windows Image List', () => {
      const downloadedFilename = path.join(downloadsFolder, 'rancher-windows-images.txt');

      aboutPage.getWindowsDownloadLink().click();
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-version').then((resp: Cypress.Response<any>) => {
        const rancherVersion = resp.body['value'];

        cy.readFile(downloadedFilename).should('contain', rancherVersion);
      });
    });
  });

  describe('CLI Downloads', () => {
    // Shouldn't be needed with https://github.com/rancher/dashboard/issues/11393
    const expectedLinkStatusCode = 200;

    // workaround to make the following CLI tests work https://github.com/cypress-io/cypress/issues/8089#issuecomment-1585159023
    beforeEach(() => {
      aboutPage.goTo();
      cy.intercept('GET', 'https://releases.rancher.com/cli2/**').as('download');
    });

    it('can download macOS CLI', () => {
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
    });

    it('can download Linux CLI', () => {
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
    });

    it('can download Windows CLI', () => {
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
    });
  });
});
