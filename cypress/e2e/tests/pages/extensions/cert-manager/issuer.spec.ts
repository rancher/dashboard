import IssuerCreatePo from '@/cypress/e2e/po/pages/extensions/cert-manager/issuer.po';
import { generateCertManagerForIssuerCreate } from '@/cypress/e2e/blueprints/other-products/cert-manager';

/**
 * Create-form coverage for the cert-manager Issuer and ClusterIssuer, which share the IssuerEdit
 * component. The CRDs are not installed on the CI cluster, so the schemas are mocked (see
 * blueprints/other-products/cert-manager) and the create request is stubbed. This exercises the
 * config-type switching and the per-type validation without a live cert-manager install.
 */
describe('Cert Manager issuer create', { tags: ['@extensions', '@adminUser'] }, () => {
  const ISSUER_URL = '/k8s/clusters/local/v1/cert-manager.io.issuer';
  const CLUSTER_ISSUER_URL = '/k8s/clusters/local/v1/cert-manager.io.clusterissuer';

  beforeEach(() => {
    cy.login();
    generateCertManagerForIssuerCreate();
  });

  it('defaults to a self-signed issuer that needs no extra configuration', () => {
    cy.intercept('POST', ISSUER_URL, (req) => {
      req.reply({ statusCode: 201, body: req.body });
    }).as('createIssuer');

    const form = new IssuerCreatePo();

    form.goTo();
    form.waitForPage();

    // Self Signed is the first (default) config type, so its help banner is shown up front.
    form.banners().should('contain.text', 'A self signed issuer');

    form.nameNsDescription().name().set('selfsigned-issuer');
    form.nameNsDescription().selectNamespace('default');

    // No further configuration required - the form is valid with just a name.
    form.saveButton().expectToBeEnabled();
    form.saveButton().click();

    cy.wait('@createIssuer').then(({ request }) => {
      expect(request.body.metadata.name).to.eq('selfsigned-issuer');
      expect(request.body.metadata.namespace).to.eq('default');
      expect(request.body.spec).to.have.property('selfSigned');
    });
  });

  it('requires a secret name for a CA issuer', () => {
    cy.intercept('POST', ISSUER_URL, (req) => {
      req.reply({ statusCode: 201, body: req.body });
    }).as('createIssuer');

    const form = new IssuerCreatePo();

    form.goTo();
    form.waitForPage();

    form.nameNsDescription().name().set('ca-issuer');
    form.nameNsDescription().selectNamespace('default');

    // Switch to CA: its secret name is required, so the form is invalid until it is supplied.
    form.configType().set(1);
    form.saveButton().expectToBeDisabled();

    form.caSecretName().set('ca-key-pair');
    form.saveButton().expectToBeEnabled();
    form.saveButton().click();

    cy.wait('@createIssuer').then(({ request }) => {
      expect(request.body.spec.ca.secretName).to.eq('ca-key-pair');
      expect(request.body.spec).to.not.have.property('selfSigned');
    });
  });

  it('requires a private key secret for an ACME issuer', () => {
    const form = new IssuerCreatePo();

    form.goTo();
    form.waitForPage();

    form.nameNsDescription().name().set('acme-issuer');
    form.nameNsDescription().selectNamespace('default');

    // ACME seeds the production server URL but leaves the private key secret empty, which is
    // required, so create stays disabled until it is filled in.
    form.configType().set(2);
    form.saveButton().expectToBeDisabled();

    form.acmePrivateKeySecret().set('letsencrypt-account-key');
    form.saveButton().expectToBeEnabled();
  });

  it('directs unsupported types to the YAML editor', () => {
    const form = new IssuerCreatePo();

    form.goTo();
    form.waitForPage();

    // Vault is not modelled by the form; it shows a notice pointing at YAML instead of inputs.
    form.configType().set(3);
    form.banners().should('contain.text', 'Switch to YAML');
  });

  it('creates a cluster-scoped issuer without a namespace', () => {
    cy.intercept('POST', CLUSTER_ISSUER_URL, (req) => {
      req.reply({ statusCode: 201, body: req.body });
    }).as('createClusterIssuer');

    const form = new IssuerCreatePo('cert-manager.io.clusterissuer');

    form.goTo('cert-manager.io.clusterissuer');
    form.waitForPage();

    form.nameNsDescription().name().set('selfsigned-cluster-issuer');
    form.saveButton().expectToBeEnabled();
    form.saveButton().click();

    cy.wait('@createClusterIssuer').then(({ request }) => {
      expect(request.body.metadata.name).to.eq('selfsigned-cluster-issuer');
      expect(request.body.metadata.namespace).to.be.undefined;
      expect(request.body.spec).to.have.property('selfSigned');
    });
  });
});
