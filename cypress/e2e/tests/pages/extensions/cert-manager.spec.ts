import CertManagerOverviewPo from '@/cypress/e2e/po/pages/extensions/cert-manager.po';
import { generateCertManagerEmpty, generateCertManagerWithData } from '@/cypress/e2e/blueprints/other-products/cert-manager';

/**
 * Overview coverage for the cert-manager extension. The cert-manager CRDs are not installed on the
 * CI cluster, so the extension's Steve schemas and collection endpoints are mocked
 * (see blueprints/other-products/cert-manager). This exercises the page's aggregation and layout
 * without depending on a live cert-manager install.
 */
describe('Cert Manager overview', { tags: ['@extensions', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('empty state', () => {
    it('shows the get-started prompt when nothing is installed', () => {
      generateCertManagerEmpty();

      const overview = new CertManagerOverviewPo();

      overview.goTo();
      overview.waitForPage();

      overview.emptyState().should('be.visible');
      overview.emptyState().find('.btn.role-primary').should('be.visible');
      overview.emptyState().find('.btn.role-secondary').should('be.visible');

      // No summary content until there is something to summarise.
      overview.self().get('[data-testid="cert-manager-overview-card"]').should('not.exist');
    });
  });

  describe('populated', () => {
    beforeEach(() => {
      generateCertManagerWithData();

      const overview = new CertManagerOverviewPo();

      overview.goTo();
      overview.waitForPage();
    });

    it('renders the certificates section with the expiry summary', () => {
      const overview = new CertManagerOverviewPo();

      overview.certificatesSection().should('be.visible');
      // The get-started prompt is replaced once certificates exist.
      overview.emptyState().should('not.exist');
      overview.certificatesEmpty().should('not.exist');
    });

    it('lists the soonest-to-expire certificates and links to the rest', () => {
      const overview = new CertManagerOverviewPo();

      // Only the three soonest are listed (EXPIRING_SOON_LIMIT).
      overview.expiringSoonRows().should('have.length', 3);
      overview.expiringSoonRows().first().should('contain.text', 'expired-cert');

      // Six certificates total, three shown, so an overflow link accounts for the remainder.
      overview.expiringMoreLink().should('be.visible');
    });

    it('always shows both issuer scopes and the ACME activity cards', () => {
      const overview = new CertManagerOverviewPo();

      // Issuers (with data) + Cluster Issuers (with data) + Orders + Challenges (always shown).
      overview.issuersSection().should('be.visible');
      overview.acmeSection().should('be.visible');
      // Certificates + 2 issuer cards + 2 ACME cards.
      overview.cards().should('have.length', 5);
    });
  });

  describe('issuers present but no certificates', () => {
    it('shows the inline create-certificate prompt', () => {
      generateCertManagerEmpty();
      // Add a single issuer so the page has content but still no certificates.
      cy.intercept('GET', '/k8s/clusters/local/v1/cert-manager.io.issuer?*', {
        statusCode: 200,
        body:       {
          type:         'collection',
          resourceType: 'cert-manager.io.issuer',
          count:        1,
          data:         [{
            id:       'default/only-issuer',
            type:     'cert-manager.io.issuer',
            metadata: {
              name:      'only-issuer',
              namespace: 'default',
              state:     {
                name: 'active', error: false, transitioning: false
              }
            },
            spec:   { selfSigned: {} },
            status: { conditions: [{ type: 'Ready', status: 'True' }] },
          }],
        },
      }).as('certManager-single-issuer');

      const overview = new CertManagerOverviewPo();

      overview.goTo();
      overview.waitForPage();

      overview.certificatesEmpty().should('be.visible');
      overview.createCertificateButton().should('be.visible');
    });
  });
});
