import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import PodSecurityAdmissionsPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-admissions.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('Pod Security Admissions', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const podSecurityAdmissionsPage = new PodSecurityAdmissionsPagePo('local');
  const downloadsFolder = Cypress.config('downloadsFolder');
  const runTimestamp = +new Date();
  const policyAdmissionName = `e2e-pod-security-admission-name-${ runTimestamp }`;
  const policyAdmissionDescription = `e2e-pod-security-admission-description-${ runTimestamp }`;

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
  });

  it('can navigate to Pod Security Admissions', () => {
    const sideNav = new ProductNavPo();
    const clusterList = new ClusterManagerListPagePo('local');

    clusterList.goTo();
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('Pod Security Admissions');
    podSecurityAdmissionsPage.waitForPage();
  });

  it('can create a policy security admission', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.create();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().waitForPage();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().name().set(policyAdmissionName);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().description().set(policyAdmissionDescription);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(policyAdmissionName, 1).should('be.visible');
  });

  it('can edit a policy security admission', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Edit Config').click();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm(policyAdmissionName).waitForPage('mode=edit');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().description().set(`${ policyAdmissionDescription }-edit`);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('PUT', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/**');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(`${ policyAdmissionDescription }-edit`, 1).should('be.visible');
  });

  it('can clone a policy security admission', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Clone').click();
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm(policyAdmissionName).waitForPage('mode=clone');
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().name().set(`${ policyAdmissionName }-clone`);
    podSecurityAdmissionsPage.createPodSecurityAdmissionForm().saveAndWaitForRequests('POST', '/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    podSecurityAdmissionsPage.list().details(`${ policyAdmissionName }-clone`, 1).should('be.visible');
  });

  it('can download YAML for a policy security admission', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.list().actionMenu(policyAdmissionName).getMenuItem('Download YAML').click();

    const downloadedFilename = path.join(downloadsFolder, `${ policyAdmissionName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('management.cattle.io/v3');
      expect(obj.metadata.name).to.equal(policyAdmissionName);
      expect(obj.kind).to.equal('PodSecurityAdmissionConfigurationTemplate');
    });
  });

  it('can delete a policy security admission', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.list().actionMenu(`${ policyAdmissionName }-clone`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ policyAdmissionName }-clone`).as('deletePolicyAdmission');

    promptRemove.remove();
    cy.wait('@deletePolicyAdmission');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    cy.contains(`${ policyAdmissionName }-clone`).should('not.exist');
  });

  it('can delete a policy security admission via bulk actions', () => {
    podSecurityAdmissionsPage.goTo();
    podSecurityAdmissionsPage.list().details(policyAdmissionName, 0).click();
    podSecurityAdmissionsPage.list().resourceTable().sortableTable().deleteButton()
      .click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `/v1/management.cattle.io.podsecurityadmissionconfigurationtemplates/${ policyAdmissionName }`).as('deletePolicyAdmission');

    promptRemove.remove();
    cy.wait('@deletePolicyAdmission');
    podSecurityAdmissionsPage.waitForPage();

    // check list details
    cy.contains(policyAdmissionName).should('not.exist');
  });
});
