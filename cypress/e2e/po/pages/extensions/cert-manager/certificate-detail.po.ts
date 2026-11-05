import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

/**
 * The cert-manager Certificate detail page. Certificates are namespaced under the explorer product,
 * so the detail page lives at `/c/<cluster>/explorer/cert-manager.io.certificate/<namespace>/<name>`.
 */
export default class CertificateDetailPo extends PagePo {
  private static detailPath(namespace: string, name: string, clusterId: string) {
    return `/c/${ clusterId }/explorer/cert-manager.io.certificate/${ namespace }/${ name }`;
  }

  static goTo(namespace = 'default', name = 'web-cert', clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CertificateDetailPo.detailPath(namespace, name, clusterId));
  }

  constructor(namespace = 'default', name = 'web-cert', clusterId = 'local') {
    super(CertificateDetailPo.detailPath(namespace, name, clusterId));
  }

  /** The Issuance Status card, present only when the certificate has an issuance chain. */
  issuanceStatusCard() {
    return this.self().find('[data-testid="cert-manager-issuance-status-card"]');
  }

  /** Every stage in the card, in chain order. */
  issuanceStages() {
    return this.self().find('[data-testid^="cert-manager-issuance-stage-"]');
  }

  issuanceStage(index: number) {
    return this.self().find(`[data-testid="cert-manager-issuance-stage-${ index }"]`);
  }

  tabs(): TabbedPo {
    return new TabbedPo('.dashboard-root');
  }

  /**
   * The Issuance History tab's table of CertificateRequests. The tab content pane is the
   * `<section role="tabpanel">`, whose `id` is prefixed with the Tabbed instance uid; its stable
   * handle is the `tab-panel-<name>` test id. Scope to that to avoid matching the header tab button
   * (which carries the `btn-<name>` test id).
   */
  issuanceHistoryTable(): ResourceTablePo {
    return new ResourceTablePo('section[data-testid="tab-panel-issuance-history"][role="tabpanel"]');
  }
}
