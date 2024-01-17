import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import MachineDeploymentsPagePo from '@/cypress/e2e/po/pages/cluster-manager/machine-deployments.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('MachineDeployments', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const machineDeploymentsPage = new MachineDeploymentsPagePo('_');
  const runTimestamp = +new Date();
  const machineDeploymentsName = `e2e-machinedeployment-name-${ runTimestamp }`;
  const machineDeploymentsNameClone = `e2e-machinedeployment-name-${ runTimestamp }-clone`;
  const nsName = 'default';
  let resourceVersion = '';
  let creationTimestamp = '';
  let time = '';
  let uid = '';

  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  it('can create a MachineDeployments', () => {
    MachineDeploymentsPagePo.navTo();
    machineDeploymentsPage.waitForPage();

    machineDeploymentsPage.create();

    machineDeploymentsPage.createEditMachineDeployment().waitForPage('as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments.yml').then((machineDeploymentDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineDeploymentDoc);

      json.metadata.name = machineDeploymentsName;
      machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machinedeployments').as('createMachineDeployment');
    machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@createMachineDeployment').then((req) => {
      resourceVersion = req.response?.body.metadata.resourceVersion;
      creationTimestamp = req.response?.body.metadata.creationTimestamp;
      time = req.response?.body.metadata.managedFields[0].time;
      uid = req.response?.body.metadata.uid;
    });
    machineDeploymentsPage.waitForPage();
    machineDeploymentsPage.list().details(machineDeploymentsName, 1).should('be.visible');
  });

  it('can edit a MachineDeployments', () => {
    MachineDeploymentsPagePo.navTo();

    machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Edit YAML').click();
    machineDeploymentsPage.createEditMachineDeployment(nsName, machineDeploymentsName).waitForPage('mode=edit&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments-edit.yml').then((machineSetDoc) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(machineSetDoc);

      json.spec.template.spec.bootstrap.dataSecretName = 'secretName2';
      json.metadata.creationTimestamp = creationTimestamp;
      json.metadata.managedFields.time = time;
      json.metadata.uid = uid;
      json.metadata.name = machineDeploymentsName;
      json.metadata.resourceVersion = resourceVersion;
      machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('PUT', `/v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsName }`).as('updateMachineSet');
    machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@updateMachineSet').its('response.statusCode').should('eq', 200);
    machineDeploymentsPage.waitForPage();

    // check details page
    machineDeploymentsPage.list().details(machineDeploymentsName, 2).find('a').click();
    cy.contains('secretName2').scrollIntoView().should('be.visible');
  });

  it('can clone a MachineDeployments', () => {
    MachineDeploymentsPagePo.navTo();

    machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Clone').click();
    machineDeploymentsPage.createEditMachineDeployment(nsName, machineDeploymentsName).waitForPage('mode=clone&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-deployments.yml').then((machineSetDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineSetDoc);

      json.metadata.name = machineDeploymentsNameClone;
      machineDeploymentsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', 'v1/cluster.x-k8s.io.machinedeployments').as('cloneMachineSet');
    machineDeploymentsPage.createEditMachineDeployment().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@cloneMachineSet').its('response.statusCode').should('eq', 201);
    machineDeploymentsPage.waitForPage();

    // check list details
    machineDeploymentsPage.list().details(machineDeploymentsNameClone, 2).should('be.visible');
  });

  it('can download YAML', () => {
    MachineDeploymentsPagePo.navTo();
    machineDeploymentsPage.list().actionMenu(machineDeploymentsName).getMenuItem('Download YAML').click();

    const downloadedFilename = path.join(downloadsFolder, `${ machineDeploymentsName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
      expect(obj.metadata.name).to.equal(machineDeploymentsName);
      expect(obj.kind).to.equal('MachineDeployment');
    });
  });

  it('can delete a MachineDeployments', () => {
    MachineDeploymentsPagePo.navTo();

    // delete original cloned MachineSet
    machineDeploymentsPage.list().actionMenu(machineDeploymentsNameClone).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsNameClone }`).as('deleteMachineSet');

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineDeploymentsPage.waitForPage();

    // check list details
    cy.contains(machineDeploymentsNameClone).should('not.exist');
  });

  it('can delete MachineDeployments via bulk actions', () => {
    MachineDeploymentsPagePo.navTo();

    // delete original MachineSet
    machineDeploymentsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(machineDeploymentsName)
      .set();
    machineDeploymentsPage.list().openBulkActionDropdown();

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinedeployments/${ nsName }/${ machineDeploymentsName }`).as('deleteMachineSet');
    machineDeploymentsPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineDeploymentsPage.waitForPage();

    // check list details
    cy.contains(machineDeploymentsName).should('not.exist');
  });
});
