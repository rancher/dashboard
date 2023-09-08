import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';
import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const aboutPage = new AboutPagePo();
const downloadsFolder = Cypress.config('downloadsFolder');

describe('About Page', { testIsolation: 'off', tags: ['@adminUser', '@standardUser', '@debug'] }, () => {
  let rancherVersion: any;
  let macOsVersion: any;
  let linuxVersion: any;
  let windowsVersion: any;

  before(() => {
    cy.login();
    aboutPage.goTo();

    aboutPage.getLinkDestination('View release notes').then((el) => {
      rancherVersion = el.split('/')[7];
    });

    aboutPage.getLinkDestination('rancher-darwin').then((el) => {
      macOsVersion = el.split('/')[5];
    });

    aboutPage.getLinkDestination('rancher-linux').then((el) => {
      linuxVersion = el.split('/')[5];
    });

    aboutPage.getLinkDestination('rancher-windows').then((el) => {
      windowsVersion = el.split('/')[5];
    });
  });

  beforeEach(() => {
    cy.wrap(rancherVersion).as('rancherVersion');
    cy.wrap(macOsVersion).as('macOsVersion');
    cy.wrap(linuxVersion).as('linuxVersion');
    cy.wrap(windowsVersion).as('windowsVersion');
    aboutPage.goTo();
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

  describe('Versions', () => {
    it('can see rancher version', function() {
      // Check Rancher version
      cy.contains(this.rancherVersion).should('be.visible');
    });

    it('can View release notes', function() {
      aboutPage.clickVersionLink('View release notes');

      const url = `https://github.com/rancher/rancher/releases/tag/${ this.rancherVersion }`;

      cy.origin('https://github.com/rancher/rancher', { args: { url } }, ({ url }) => {
        cy.url().should('include', url);
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
    it('can download Linux Image List', function() {
      // Download txt and verify file exists
      const downloadedFilename = path.join(downloadsFolder, 'rancher-linux-images.txt');

      aboutPage.getLinuxDownloadLink().click();
      cy.readFile(downloadedFilename).should('contain', `rancher/rancher-agent:${ this.rancherVersion }`);
    });

    it('can download Windows Image List', function() {
      // Download txt and do basic check
      const downloadedFilename = path.join(downloadsFolder, 'rancher-windows-images.txt');

      aboutPage.getWindowsDownloadLink().click();
      cy.readFile(downloadedFilename).should('contain', `rancher/rancher-agent:${ this.rancherVersion }`);
    });
  });

  describe.skip('CLI Downloads', () => {
    // workaround to make the following CLI tests work https://github.com/cypress-io/cypress/issues/8089#issuecomment-1585159023
    it('can download macOS CLI', function() {
      // Download CLI and verify it exists
      const downloadedFilename = path.join(downloadsFolder, `${ this.macOsVersion }`);

      aboutPage.getMacCliDownloadLink().then((el: any) => {
        el.attr('download', '');
      }).click();
      cy.readFile(downloadedFilename, 'base64').should('exist');
    });

    it('can download Linux CLI', function() {
      // Download CLI and verify it exists
      const downloadedFilename = path.join(downloadsFolder, `${ this.linuxVersion }`);

      aboutPage.getLinuxCliDownloadLink().then((el: any) => {
        el.attr('download', '');
      }).click();
      cy.readFile(downloadedFilename, 'base64').should('exist');
    });

    it('can download Windows CLI', function() {
      // Download CLI and verify it exists
      const downloadedFilename = path.join(downloadsFolder, `${ this.windowsVersion }`);

      aboutPage.getWindowsCliDownloadLink().then((el: any) => {
        el.attr('download', '');
      }).click();
      cy.readFile(downloadedFilename, 'base64').should('exist');
    });
  });
});
