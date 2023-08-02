import DiagnosticsPagePo from '~/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Diagnostics Page', { tags: ['@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('User should be able to download the diagnostics package JSON', () => {
    const DiagnosticsPage = new DiagnosticsPagePo();

    DiagnosticsPage.goTo();

    // open modal
    DiagnosticsPage.downloadDiagnosticsPackageClick();

    // modal button to actually trigger the download
    DiagnosticsPage.downloadDiagnosticsModalActionClick();

    const downloadedFilename = path.join(downloadsFolder, 'rancher-diagnostic-data.json');

    cy.readFile(downloadedFilename).should('exist').then((file: any) => {
      expect(Object.keys(file).length).to.equal(5);
    });
  });
});
