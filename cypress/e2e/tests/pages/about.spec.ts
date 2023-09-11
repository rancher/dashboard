import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const aboutPage = new AboutPagePo();
const downloadsFolder = Cypress.config('downloadsFolder');

describe('About Page', { testIsolation: 'off', tags: ['@adminUser', '@standardUser', '@debug'] }, () => {
  before(() => {
    cy.login();
  });

  it('can navigate to About page', () => {
    HomePagePo.goToAndWaitForGet();

    const burgerMenu = new BurgerMenuPo();

    BurgerMenuPo.toggle();
    burgerMenu.about().click();
    aboutPage.waitForPage();
  });

  it('can navigate to Diagnostics page', () => {
    aboutPage.goTo();
    aboutPage.waitForPage();
    aboutPage.diagnosticsBtn().click();

    const diagnosticsPo = new DiagnosticsPagePo();

    diagnosticsPo.waitForPage();
  });

  it('can View release notes', () => {
    aboutPage.goTo();
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
      cy.getUserPreferences().then((resp: Cypress.Response<any>) => {
        const rancherVersion = JSON.parse(resp.body.data[0]['data']['seen-whatsnew']);

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
    beforeEach(() => {
      aboutPage.goTo();
    });

    it('can download Linux Image List', () => {
      // Download txt and verify file exists
      const downloadedFilename = path.join(downloadsFolder, 'rancher-linux-images.txt');

      aboutPage.getLinuxDownloadLink().click();

      cy.getUserPreferences().then((resp: Cypress.Response<any>) => {
        const rancherVersion = JSON.parse(resp.body.data[0]['data']['seen-whatsnew']);

        cy.readFile(downloadedFilename).should('contain', rancherVersion);
      });
    });

    it('can download Windows Image List', () => {
      const downloadedFilename = path.join(downloadsFolder, 'rancher-windows-images.txt');

      aboutPage.getWindowsDownloadLink().click();
      cy.getUserPreferences().then((resp: Cypress.Response<any>) => {
        const rancherVersion = JSON.parse(resp.body.data[0]['data']['seen-whatsnew']);

        cy.readFile(downloadedFilename).should('contain', rancherVersion);
      });
    });
  });

  describe('CLI Downloads', () => {
    // workaround to make the following CLI tests work https://github.com/cypress-io/cypress/issues/8089#issuecomment-1585159023
    beforeEach(() => {
      aboutPage.goTo();
      cy.intercept('GET', 'https://releases.rancher.com/cli2/**').as('download');
    });

    it('can download macOS CLI', () => {
      aboutPage.getLinkDestination('rancher-darwin').then((el) => {
        const macOsVersion = el.split('/')[5];

        aboutPage.getMacCliDownloadLink().then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.url).includes(macOsVersion);
        });
      });
    });

    it('can download Linux CLI', () => {
      aboutPage.getLinkDestination('rancher-linux').then((el) => {
        const linuxVersion = el.split('/')[5];

        aboutPage.getLinuxCliDownloadLink().then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.url).includes(linuxVersion);
        });
      });
    });

    it('can download Windows CLI', () => {
      aboutPage.getLinkDestination('rancher-windows').then((el) => {
        const windowsVersion = el.split('/')[5];

        aboutPage.getWindowsCliDownloadLink().then((el: any) => {
          el.attr('download', '');
        }).click();
        cy.wait('@download').then(({ request, response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(request.url).includes(windowsVersion);
        });
      });
    });
  });
});
