import PodSecurityAdmissionsPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-admissions.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { createPayloadData, updatePayloadData } from '@/cypress/e2e/blueprints/cluster_management/pod-security-admissions-payload';

describe('Pod Security Admissions', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const podSecurityAdmissionsPage = new PodSecurityAdmissionsPagePo();
  const resourceDetails = new ResourceDetailPo('.main-layout');
  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
    cy.createE2EResourceName('podsecurityadmissions').as('podSecurityAdmissionsName');
  });
  it('can open "Edit as YAML"', () => {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();
    podSecurityAdmissionsPage.create();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().editAsYaml().click();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().yamlEditor().checkExists();
  });

  it('can create a policy security admission', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();
    podSecurityAdmissionsPage.create();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().waitForPage();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().nameNsDescription().name().set(this.podSecurityAdmissionsName);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().nameNsDescription().description().set(`${ this.podSecurityAdmissionsName }-description`);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(0, 1);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(1, 2);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(2, 3);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(0, 'latest');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(1, 'latest');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(2, 'latest');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsCheckbox(0);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(0, 'admin,user');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsCheckbox(1);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(1, 'myclass1,myclass2');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsCheckbox(2);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(2, 'ingress-nginx,kube-system');
    resourceDetails.cruResource().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request?.body.configuration.defaults).to.deep.include(createPayloadData.configuration.defaults);
      expect(response?.body.configuration.defaults).to.deep.include(createPayloadData.configuration.defaults);
      expect(request?.body.configuration.exemptions).to.deep.include(createPayloadData.configuration.exemptions);
      expect(response?.body.configuration.exemptions).to.deep.include(createPayloadData.configuration.exemptions);
    });
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(this.podSecurityAdmissionsName, 1).should('be.visible');
  });

  it('can edit a policy security admission', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();
    podSecurityAdmissionsPage.list().actionMenu(this.podSecurityAdmissionsName).getMenuItem('Edit Config').click();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm(this.podSecurityAdmissionsName).waitForPage('mode=edit');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().nameNsDescription().description().set(`${ this.podSecurityAdmissionsName }-description-edit`);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(0, 1);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(1, 2);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlLevel(2, 3);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(0, 'v1.25');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(1, 'v1.25');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().psaControlVersion(2, 'v1.25');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(0, 'admin1,user1');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(1, 'myclass3,myclass4');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().setExemptionsInput(2, 'cattle-system,cattle-epinio-system');
    resourceDetails.cruResource().saveAndWaitForRequests('PUT', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/**').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request?.body.configuration.defaults).to.deep.include(updatePayloadData.configuration.defaults);
      expect(response?.body.configuration.defaults).to.deep.include(updatePayloadData.configuration.defaults);
      expect(request?.body.configuration.exemptions).to.deep.include(updatePayloadData.configuration.exemptions);
      expect(response?.body.configuration.exemptions).to.deep.include(updatePayloadData.configuration.exemptions);
    });
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(`${ this.podSecurityAdmissionsName }-description-edit`, 1).should('be.visible');
  });

  it('can clone a policy security admission', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();
    podSecurityAdmissionsPage.list().actionMenu(this.podSecurityAdmissionsName).getMenuItem('Clone').click();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm(this.podSecurityAdmissionsName).waitForPage('mode=clone');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().nameNsDescription().name().set(`${ this.podSecurityAdmissionsName }-clone`);
    resourceDetails.cruResource().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(`${ this.podSecurityAdmissionsName }-clone`, 1).should('be.visible');
  });

  it('can download YAML for a policy security admission', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();
    podSecurityAdmissionsPage.list().actionMenu(this.podSecurityAdmissionsName).getMenuItem('Download YAML').click({ force: true });

    const downloadedFilename = path.join(downloadsFolder, `${ this.podSecurityAdmissionsName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('management.cattle.io/v3');
      expect(obj.metadata.name).to.equal(this.podSecurityAdmissionsName);
      expect(obj.kind).to.equal('PodSecurityAdmissionConfigurationTemplate');
    });
  });

  it('can delete a policy security admission', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().resourceTable().sortableTable().rowNames()
      .then((names) => {
        if (names.filter((name) => name === `${ this.podSecurityAdmissionsName }-clone`).length > 1) {
          cy.reload(); // need page reload here in case multiple entries are created. reload should resolve the duplicate issue
        }

        podSecurityAdmissionsPage.list().actionMenu(`${ this.podSecurityAdmissionsName }-clone`).getMenuItem('Delete').click();

        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ this.podSecurityAdmissionsName }-clone`).as('deletePolicyAdmission');

        promptRemove.remove();
        cy.wait('@deletePolicyAdmission').its('response.statusCode').should('eq', 204);
        podSecurityAdmissionsPage.waitForPage();
        cy.contains(`${ this.podSecurityAdmissionsName }-clone`).should('not.exist');
      });
  });

  it('can delete a policy security admission via bulk actions', function() {
    PodSecurityAdmissionsPagePo.navTo();
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().resourceTable().sortableTable().rowNames()
      .then((names) => {
        if (names.filter((name) => name === this.podSecurityAdmissionsName).length > 1) {
          cy.reload(); // need page reload here in case multiple entries are created. reload should resolve the duplicate issue
        }
        podSecurityAdmissionsPage.list().details(this.podSecurityAdmissionsName, 0).click();
        podSecurityAdmissionsPage.list().resourceTable().sortableTable().deleteButton()
          .click();

        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ this.podSecurityAdmissionsName }`).as('deletePolicyAdmission');

        promptRemove.remove();
        cy.wait('@deletePolicyAdmission').its('response.statusCode').should('eq', 204);

        podSecurityAdmissionsPage.waitForPage();
        cy.contains(this.podSecurityAdmissionsName).should('not.exist');
      });
  });
});
