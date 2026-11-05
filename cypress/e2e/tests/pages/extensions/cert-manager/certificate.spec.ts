import CertificateCreatePo from '@/cypress/e2e/po/pages/extensions/cert-manager/certificate.po';
import { generateCertManagerForCreate } from '@/cypress/e2e/blueprints/other-products/cert-manager';

/**
 * Create-form coverage for the cert-manager Certificate. The cert-manager CRDs are not installed on
 * the CI cluster, so the schemas and the issuer list are mocked (see
 * blueprints/other-products/cert-manager) and the create request is stubbed. This exercises the
 * form's validation and the resource it builds without a live cert-manager install.
 */
describe('Cert Manager certificate create', { tags: ['@extensions', '@adminUser'] }, () => {
  const CREATE_URL = '/k8s/clusters/local/v1/cert-manager.io.certificate';

  beforeEach(() => {
    cy.login();
    generateCertManagerForCreate();
  });

  it('keeps create disabled until an identifier is supplied', () => {
    const form = new CertificateCreatePo();

    form.goTo();
    form.waitForPage();

    // Name, secret and issuer are all required, so create starts disabled.
    form.saveButton().expectToBeDisabled();

    form.nameNsDescription().name().set('my-cert');
    form.nameNsDescription().selectNamespace('default');
    form.secretName().set('my-cert-tls');
    form.issuerSelect().toggle();
    form.issuerSelect().clickOptionWithLabel('default-issuer');

    // Still no common name or SAN, so the "at least one identifier" rule keeps it disabled.
    form.saveButton().expectToBeDisabled();

    form.dnsNames().setValueAtIndex('example.com', 0, 'Add DNS Name');

    // With a DNS name the form is now valid.
    form.saveButton().expectToBeEnabled();
  });

  it('clears the selected issuer when the issuer scope changes', () => {
    const form = new CertificateCreatePo();

    form.goTo();
    form.waitForPage();

    form.nameNsDescription().selectNamespace('default');
    form.issuerSelect().toggle();
    form.issuerSelect().clickOptionWithLabel('default-issuer');
    form.issuerSelect().checkOptionSelected('default-issuer');

    // Switching to Cluster Issuer scope invalidates the namespaced pick, so it is cleared.
    form.issuerKind().set(1);
    form.issuerSelect().self().find('.vs__selected-options > span.vs__selected').should('not.exist');
  });

  it('builds a certificate from the form values', () => {
    cy.intercept('POST', CREATE_URL, (req) => {
      req.reply({ statusCode: 201, body: req.body });
    }).as('createCertificate');

    const form = new CertificateCreatePo();

    form.goTo();
    form.waitForPage();

    form.nameNsDescription().name().set('web-cert');
    form.nameNsDescription().selectNamespace('default');
    form.secretName().set('web-cert-tls');
    form.issuerSelect().toggle();
    form.issuerSelect().clickOptionWithLabel('default-issuer');
    form.dnsNames().setValueAtIndex('web.example.com', 0, 'Add DNS Name');

    form.saveButton().click();

    cy.wait('@createCertificate').then(({ request }) => {
      expect(request.body.metadata.name).to.eq('web-cert');
      expect(request.body.metadata.namespace).to.eq('default');
      expect(request.body.spec.secretName).to.eq('web-cert-tls');
      expect(request.body.spec.issuerRef.name).to.eq('default-issuer');
      expect(request.body.spec.issuerRef.kind).to.eq('Issuer');
      expect(request.body.spec.dnsNames).to.deep.eq(['web.example.com']);
    });
  });
});
