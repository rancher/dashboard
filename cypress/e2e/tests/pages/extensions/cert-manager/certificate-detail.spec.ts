import CertificateDetailPo from '@/cypress/e2e/po/pages/extensions/cert-manager/certificate-detail.po';
import { generateCertManagerCertificateDetail, generateCertManagerCertificateDetailNoChain } from '@/cypress/e2e/blueprints/other-products/cert-manager';

/**
 * Detail-page coverage for the cert-manager Certificate, focused on the IssuanceProgress stepper.
 * The CRDs are not installed on the CI cluster, so the certificate and its issuance chain
 * (CertificateRequest -> Order -> Challenge) are mocked (see blueprints/other-products/cert-manager).
 * The chain is wired with the annotations and owner references cert-manager uses, so the model
 * getters reassemble it exactly as they would against a live install.
 */
describe('Cert Manager certificate detail', { tags: ['@extensions', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('with a full issuance chain', () => {
    beforeEach(() => {
      generateCertManagerCertificateDetail();

      const detail = new CertificateDetailPo();

      detail.goTo();
      detail.waitForPage();

      // The stepper and issuance-history tab only fill in once the related types have loaded, so
      // wait for those collection fetches before asserting on the reassembled chain.
      cy.wait(['@certManager-certificaterequests', '@certManager-orders', '@certManager-challenges']);
    });

    it('renders the issuance progress stepper stage by stage', () => {
      const detail = new CertificateDetailPo();

      detail.issuanceProgress().should('be.visible');

      // Certificate -> CertificateRequest -> Order -> Challenge, in chain order.
      detail.issuanceStages().should('have.length', 4);
      detail.issuanceStage(0).should('contain.text', 'Certificate');
      detail.issuanceStage(1).should('contain.text', 'Certificate Request');
      detail.issuanceStage(2).should('contain.text', 'ACME Order');
      detail.issuanceStage(3).should('contain.text', 'ACME Challenge');
    });

    it('lists the certificate requests in the issuance history tab', () => {
      const detail = new CertificateDetailPo();

      detail.tabs().clickTabWithName('issuance-history');
      detail.issuanceHistoryTable().self().should('contain.text', 'web-cert-1');
    });
  });

  describe('without an issuance chain', () => {
    it('omits the stepper when the certificate is the only stage', () => {
      generateCertManagerCertificateDetailNoChain();

      const detail = new CertificateDetailPo();

      detail.goTo();
      detail.waitForPage();

      // A single stage is not progress, so the widget is suppressed entirely.
      detail.issuanceProgress().should('not.exist');
    });
  });
});
