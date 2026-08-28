import CertManagerOverviewPo from '@/cypress/e2e/po/pages/extensions/cert-manager/overview.po';
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
      overview.cards().should('not.exist');
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

    it('lists the soonest-to-expire certificates', () => {
      const overview = new CertManagerOverviewPo();

      // Five of the six certificates have an expiry; pending-cert has none and is skipped. All five
      // fit within EXPIRING_SOON_LIMIT (5), soonest first.
      overview.expiringSoonRows().should('have.length', 5);
      overview.expiringSoonRows().first().should('contain.text', 'expired-cert');
    });

    it('shows both issuer scopes and the ACME activity (orders only)', () => {
      const overview = new CertManagerOverviewPo();

      overview.issuersSection().should('be.visible');
      overview.acmeSection().should('be.visible');
      // ACME activity is Orders only - Challenges are transient and not shown on the overview.
      overview.acmeCards().should('have.length', 1);
      // Certificates + 2 issuer cards + 1 Orders card.
      overview.cards().should('have.length', 4);
    });
  });

  describe('ACME activity without orders', () => {
    it('hides the ACME section when there are no orders', () => {
      generateCertManagerWithData();
      // Override the orders collection so the ACME section has nothing to show.
      cy.intercept('GET', '/k8s/clusters/local/v1/acme.cert-manager.io.order?*', {
        statusCode: 200,
        body:       {
          type: 'collection', resourceType: 'acme.cert-manager.io.order', count: 0, data: []
        },
      }).as('certManager-orders-empty');

      const overview = new CertManagerOverviewPo();

      overview.goTo();
      overview.waitForPage();

      overview.acmeSection().should('not.exist');
      // Certificates + 2 issuer cards, no ACME card.
      overview.cards().should('have.length', 3);
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

      // No cluster issuers exist, so that card shows its empty message and an inline create action.
      overview.issuersSection().contains('No cluster issuers available').should('be.visible');
      overview.issuersSection().contains('a', 'Create Cluster Issuer').should('be.visible');
    });
  });
});
