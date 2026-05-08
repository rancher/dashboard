import DiagnosticsPagePo from '@/cypress/e2e/po/pages/diagnostics.po';
import * as path from 'path';
import { qase } from '@/cypress/support/qase';

const downloadsFolder = Cypress.config('downloadsFolder');
const downloadedFilename = path.join(downloadsFolder, 'rancher-diagnostic-data.json');

describe('Diagnostics Page', { tags: ['@generic', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    // Keep the downloads directory clean between tests.
    cy.deleteDownloadsFolder();
  });

  qase(1454, it('User should be able to download the diagnostics package JSON', () => {
    // Ignore the focus-trap error that fires when the modal closes immediately
    // after the download is triggered (known cosmetic side-effect of the dialog)
    // Also the focus-trap error triggered when it can’t find any tabbable node inside its container
    // This workaround is needed until we can update the focus-trap library to a version that has the fix for this issue https://github.com/rancher/dashboard/issues/17104

    cy.on('uncaught:exception', (err) => {
      if (err?.message?.includes('focus-trap') || err?.message?.includes('tabbable')) {
        return false;
      }
    });

    const diagnosticsPage = new DiagnosticsPagePo();

    diagnosticsPage.goTo();

    // open modal
    diagnosticsPage.diagnosticsPackageBtn().click(true);

    // modal button to actually trigger the download
    diagnosticsPage.downloadDiagnosticsModalActionBtn().click(true);

    cy.readFile(downloadedFilename).should('exist').then((file: any) => {
      expect(Object.keys(file).length).to.equal(4);
    });
  }));
  afterEach(() => {
    // Keep the downloads directory clean between tests.
    cy.deleteDownloadsFolder();
  });
});
