import PagePo from '@/cypress/e2e/po/pages/page.po';

/**
 * The cert-manager extension's overview page - a custom page registered under the explorer product,
 * so it lives at `/c/<cluster>/explorer/cert-manager-overview`.
 */
export default class CertManagerOverviewPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/cert-manager-overview`;
  }

  static goTo(clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CertManagerOverviewPo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(CertManagerOverviewPo.createPath(clusterId));
  }

  /** The "get started" empty state, shown when no certificates or issuers exist. */
  emptyState() {
    return this.self().get('[data-testid="cert-manager-overview-empty"]');
  }

  /** The certificates section - present whenever there is content. */
  certificatesSection() {
    return this.self().get('[data-testid="cert-manager-overview-certificates"]');
  }

  /** The inline prompt shown when there are issuers but no certificates yet. */
  certificatesEmpty() {
    return this.self().get('[data-testid="cert-manager-overview-certificates-empty"]');
  }

  createCertificateButton() {
    return this.self().get('[data-testid="cert-manager-overview-create-certificate"]');
  }

  expiringSoonList() {
    return this.self().get('[data-testid="cert-manager-overview-expiring-soon"]');
  }

  expiringSoonRows() {
    return this.expiringSoonList().find('.expiring-row');
  }

  issuersSection() {
    return this.self().get('[data-testid="cert-manager-overview-issuers"]');
  }

  acmeSection() {
    return this.self().get('[data-testid="cert-manager-overview-acme"]');
  }

  /** The status cards within the ACME activity section (Orders only - Challenges are not shown). */
  acmeCards() {
    return this.acmeSection().find('[data-testid="cert-manager-overview-card"]');
  }

  /** Every status card across the sections. */
  cards() {
    return this.self().get('[data-testid="cert-manager-overview-card"]');
  }

  subtitle() {
    return this.self().get('[data-testid="cert-manager-overview-subtitle"]');
  }
}
