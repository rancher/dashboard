import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Diagnostics Page', { tags: ['@generic', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('User should be able to download the diagnostics package JSON', () => {
    // Ignore the focus-trap error that fires when the modal closes immediately
    // after the download is triggered (known cosmetic side-effect of the dialog)
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('focus-trap')) {
        return false;
      }
    });

    const diagnosticsPage = new DiagnosticsPagePo();

    diagnosticsPage.goTo();

    // Wait for page to fully load before opening modal
    diagnosticsPage.diagnosticsPackageBtn().self().should('be.visible').and('be.enabled');

    // open modal
    diagnosticsPage.diagnosticsPackageBtn().click(true);

    // Wait for modal to appear and download button to be ready
    diagnosticsPage.downloadDiagnosticsModalActionBtn().self().should('be.visible').and('be.enabled');

    // modal button to actually trigger the download
    diagnosticsPage.downloadDiagnosticsModalActionBtn().click(true);

    const downloadedFilename = path.join(downloadsFolder, 'rancher-diagnostic-data.json');

    cy.readFile(downloadedFilename).should('exist').then((file: any) => {
      expect(Object.keys(file).length).to.equal(4);
    });
  });
});
