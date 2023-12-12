import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Diagnostics Page', { tags: ['@generic', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('User should be able to download the diagnostics package JSON', () => {
    const diagnosticsPage = new DiagnosticsPagePo();

    diagnosticsPage.goTo();

    // open modal
    diagnosticsPage.diagnosticsPackageBtn().click(true);

    // modal button to actually trigger the download
    diagnosticsPage.downloadDiagnosticsModalActionBtn().click(true);

    const downloadedFilename = path.join(downloadsFolder, 'rancher-diagnostic-data.json');

    cy.readFile(downloadedFilename).should('exist').then((file: any) => {
      expect(Object.keys(file).length).to.equal(4);
    });
  });
});
