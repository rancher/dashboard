import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import MachineSetsPagePo from '@/cypress/e2e/po/pages/cluster-manager/machine-sets.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('MachineSets', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const machineSetsPage = new MachineSetsPagePo('_');
  const runTimestamp = +new Date();
  const machineSetName = `e2e-machineset-name-${ runTimestamp }`;
  const machineSetCloneName = `e2e-machineset-name-${ runTimestamp }-clone`;
  const nsName = 'default';
  let resourceVersion = '';
  let creationTimestamp = '';
  let time = '';
  let uid = '';

  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  it('can create a MachineSet', () => {
    MachineSetsPagePo.navTo()
    machineSetsPage.waitForPage()
    machineSetsPage.create();

    machineSetsPage.createEditMachineSet().waitForPage('as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineSetDoc);

      json.metadata.name = machineSetName;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('createMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().click();
    cy.wait('@createMachineSet').then((req) => {
      resourceVersion = req.response?.body.metadata.resourceVersion;
      creationTimestamp = req.response?.body.metadata.creationTimestamp;
      time = req.response?.body.metadata.managedFields[0].time;
      uid = req.response?.body.metadata.uid;
    });
    machineSetsPage.waitForPage();
    machineSetsPage.list().details(machineSetName, 1).should('be.visible');
  });

  it('can edit a MachineSet', () => {
    MachineSetsPagePo.navTo();
    machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Edit YAML').click();
    machineSetsPage.createEditMachineSet(nsName, machineSetName).waitForPage('mode=edit&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets-edit.yml').then((machineSetDoc) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(machineSetDoc);

      json.spec.template.spec.bootstrap.dataSecretName = 'secretName2';
      json.metadata.creationTimestamp = creationTimestamp;
      json.metadata.managedFields.time = time;
      json.metadata.uid = uid;
      json.metadata.name = machineSetName;
      json.metadata.resourceVersion = resourceVersion;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('PUT', `/v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetName }`).as('updateMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().click();
    cy.wait('@updateMachineSet').its('response.statusCode').should('eq', 200);
    machineSetsPage.waitForPage();

    // check details page
    machineSetsPage.list().details(machineSetName, 2).find('a').click();
    cy.contains('secretName2').should('be.visible');
  });

  it('can clone a MachineSet', () => {
    MachineSetsPagePo.navTo();
    machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Clone').click();
    machineSetsPage.createEditMachineSet(nsName, machineSetName).waitForPage('mode=clone&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineSetDoc);

      json.metadata.name = machineSetCloneName;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('cloneMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().click();
    cy.wait('@cloneMachineSet').its('response.statusCode').should('eq', 201);
    machineSetsPage.waitForPage();

    // check list details
    machineSetsPage.list().details(machineSetCloneName, 2).should('be.visible');
  });

  it('can download YAML', () => {
    MachineSetsPagePo.navTo();
    machineSetsPage.list().actionMenu(machineSetName).getMenuItem('Download YAML').click();

    const downloadedFilename = path.join(downloadsFolder, `${ machineSetName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
      expect(obj.metadata.name).to.equal(machineSetName);
      expect(obj.kind).to.equal('MachineSet');
    });
  });

  it('can delete a MachineSet', () => {
    MachineSetsPagePo.navTo();

    // delete original cloned MachineSet
    machineSetsPage.list().actionMenu(machineSetCloneName).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetCloneName }`).as('deleteMachineSet');

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineSetsPage.waitForPage();

    // check list details
    cy.contains(machineSetCloneName).should('not.exist');
  });

  it('can delete MachineSet via bulk actions', () => {
    MachineSetsPagePo.navTo();

    // delete original MachineSet
    machineSetsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(machineSetName)
      .set();
    machineSetsPage.list().openBulkActionDropdown();

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ nsName }/${ machineSetName }`).as('deleteMachineSet');
    machineSetsPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineSetsPage.waitForPage();

    // check list details
    cy.contains(machineSetName).should('not.exist');
  });
});
