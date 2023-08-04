import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

/**
 * Diagnostics page
 */
export default class DiagnosticsPagePo extends PagePo {
  static url = '/diagnostic'

  constructor(pageUrl = DiagnosticsPagePo.url) {
    DiagnosticsPagePo.url = pageUrl;
    super(DiagnosticsPagePo.url);
  }

  diagnosticsPackageBtn() {
    return new AsyncButtonPo('[data-testid="diagnostics-download-diagnostic-package"]');
  }

  downloadDiagnosticsModalActionBtn() {
    return new AsyncButtonPo('[data-testid="download-diagnostics-modal-action"]');
  }
}
