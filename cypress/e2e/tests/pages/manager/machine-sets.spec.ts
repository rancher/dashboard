import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import MachineSetsPagePo from '@/cypress/e2e/po/pages/cluster-manager/machine-sets.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('MachineSets', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const machineSetsPage = new MachineSetsPagePo();
  const nsName = 'default';
  let resourceVersion = '';
  let creationTimestamp = '';
  let time = '';
  let uid = '';

  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.createE2EResourceName('machinesets').as('machineSetName');
  });

  it('can create a MachineSet', function() {
    MachineSetsPagePo.goTo();
    machineSetsPage.waitForPage();
    machineSetsPage.create();

    machineSetsPage.createEditMachineSet().waitForPage('as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineSetDoc);

      json.metadata.name = this.machineSetName;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('createMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@createMachineSet').then((req) => {
      creationTimestamp = req.response?.body.metadata.creationTimestamp;
      time = req.response?.body.metadata.managedFields[0].time;
      uid = req.response?.body.metadata.uid;
    });
    machineSetsPage.waitForPage();
    machineSetsPage.list().details(this.machineSetName, 1).should('be.visible');
  });

  it('can edit a MachineSet', function() {
    MachineSetsPagePo.navTo();
    machineSetsPage.waitForPage();
    machineSetsPage.list().actionMenu(this.machineSetName).getMenuItem('Edit YAML').click();
    machineSetsPage.createEditMachineSet(nsName, this.machineSetName).waitForPage('mode=edit&as=yaml');

    cy.getRancherResource('v1', 'cluster.x-k8s.io.machinesets', `${ nsName }/${ this.machineSetName }`, 200).then((resp) => {
      // Resource gets updated post create (finalizer added). So refetch it to get the correct resourceVersion
      resourceVersion = resp.body.metadata.resourceVersion;
    });

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets-edit.yml').then((machineSetDoc) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(machineSetDoc);

      json.spec.template.spec.bootstrap.dataSecretName = 'secretName2';
      json.metadata.creationTimestamp = creationTimestamp;
      json.metadata.managedFields.time = time;
      json.metadata.uid = uid;
      json.metadata.name = this.machineSetName;
      json.metadata.resourceVersion = resourceVersion;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('PUT', `/v1/cluster.x-k8s.io.machinesets/${ nsName }/${ this.machineSetName }`).as('updateMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@updateMachineSet').its('response.statusCode').should('eq', 200);
    machineSetsPage.waitForPage();

    // check details page
    machineSetsPage.list().details(this.machineSetName, 2).find('a').click();
    cy.contains('secretName2').should('be.visible');
  });

  it('can clone a MachineSet', function() {
    MachineSetsPagePo.navTo();
    machineSetsPage.waitForPage();
    machineSetsPage.list().actionMenu(this.machineSetName).getMenuItem('Clone').click();
    machineSetsPage.createEditMachineSet(nsName, this.machineSetName).waitForPage('mode=clone&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machine-sets.yml').then((machineSetDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineSetDoc);

      json.metadata.name = `${ this.machineSetName }-clone`;
      json.metadata.namespace = nsName;
      machineSetsPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machinesets').as('cloneMachineSet');
    machineSetsPage.createEditMachineSet().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@cloneMachineSet').its('response.statusCode').should('eq', 201);
    machineSetsPage.waitForPage();

    // check list details
    machineSetsPage.list().details(`${ this.machineSetName }-clone`, 2).should('be.visible');
  });

  it('can download YAML', function() {
    MachineSetsPagePo.navTo();
    machineSetsPage.waitForPage();
    machineSetsPage.list().actionMenu(this.machineSetName).getMenuItem('Download YAML').click({ force: true });

    const downloadedFilename = path.join(downloadsFolder, `${ this.machineSetName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
      expect(obj.metadata.name).to.equal(this.machineSetName);
      expect(obj.kind).to.equal('MachineSet');
    });
  });

  it('can delete a MachineSet', function() {
    MachineSetsPagePo.navTo();
    machineSetsPage.waitForPage();

    // delete original cloned MachineSet
    machineSetsPage.list().actionMenu(`${ this.machineSetName }-clone`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();
    const name = `${ nsName }/${ this.machineSetName }-clone`;

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ name }`).as('deleteMachineSet');

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineSetsPage.waitForPage();

    cy.getRancherResource('v1', 'cluster.x-k8s.io.machinesets', `${ name }`, 200).then((resp) => {
      // Resource gets updated post create (finalizer added). So refetch it to get the correct resourceVersion
      const resource = resp.body;

      delete resource.metadata.finalizers;
      cy.setRancherResource('v1', 'cluster.x-k8s.io.machinesets', `${ name }`, resource);
    });

    // check list details
    cy.contains(`${ this.machineSetName }-clone`).should('not.exist');
  });

  it('can delete MachineSet via bulk actions', function() {
    MachineSetsPagePo.navTo();
    machineSetsPage.waitForPage();

    // delete original MachineSet
    machineSetsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(this.machineSetName)
      .set();
    machineSetsPage.list().openBulkActionDropdown();

    const name = `${ nsName }/${ this.machineSetName }`;

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machinesets/${ name }`).as('deleteMachineSet');
    machineSetsPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteMachineSet');
    machineSetsPage.waitForPage();

    cy.getRancherResource('v1', 'cluster.x-k8s.io.machinesets', `${ name }`, 200).then((resp) => {
      // Resource gets updated post create (finalizer added). So refetch it to get the correct resourceVersion
      const resource = resp.body;

      delete resource.metadata.finalizers;
      cy.setRancherResource('v1', 'cluster.x-k8s.io.machinesets', `${ name }`, resource);
    });

    // check list details
    cy.contains(this.machineSetName).should('not.exist');
  });
});
