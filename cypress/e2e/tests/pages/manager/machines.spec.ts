import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import MachinesPagePo from '@/cypress/e2e/po/pages/cluster-manager/machines.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('Machines', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const machinesPage = new MachinesPagePo();
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
    cy.createE2EResourceName('machines').as('machineName');
  });

  it('can create a Machine', function() {
    MachinesPagePo.goTo();
    machinesPage.waitForPage();
    machinesPage.create();

    machinesPage.createEditMachines().waitForPage('as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machines.yml').then((machineDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineDoc);

      json.metadata.name = this.machineName;
      json.metadata.namespace = nsName;
      json.spec.bootstrap.clusterName = 'local';
      json.spec.bootstrap.dataSecretName = 'secretName';

      machinesPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machines').as('createMachine');
    machinesPage.createEditMachines().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@createMachine').then((req) => {
      creationTimestamp = req.response?.body.metadata.creationTimestamp;
      time = req.response?.body.metadata.managedFields[0].time;
      uid = req.response?.body.metadata.uid;
    });
    machinesPage.waitForPage();
    machinesPage.list().details(this.machineName, 1).should('be.visible');
  });

  it('can edit a Machine', function() {
    MachinesPagePo.navTo();
    machinesPage.waitForPage();
    machinesPage.list().actionMenu(this.machineName).getMenuItem('Edit YAML').click();
    machinesPage.createEditMachines(nsName, this.machineName).waitForPage('mode=edit&as=yaml');

    cy.getRancherResource('v1', 'cluster.x-k8s.io.machines', `${ nsName }/${ this.machineName }`, 200).then((resp) => {
      // Resource gets updated post create (finalizer added). So refetch it to get the correct resourceVersion
      resourceVersion = resp.body.metadata.resourceVersion;
    });

    cy.readFile('cypress/e2e/blueprints/cluster_management/machines-edit.yml').then((machineDoc) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(machineDoc);

      json.spec.bootstrap.dataSecretName = 'secretName2';
      json.metadata.creationTimestamp = creationTimestamp;
      json.metadata.managedFields.time = time;
      json.metadata.uid = uid;
      json.metadata.name = this.machineName;
      json.metadata.resourceVersion = resourceVersion;
      machinesPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('PUT', `/v1/cluster.x-k8s.io.machines/${ nsName }/${ this.machineName }`).as('updateMachine');
    machinesPage.createEditMachines().saveCreateForm().resourceYaml().saveOrCreate()
      .click();
    cy.wait('@updateMachine').its('response.statusCode').should('eq', 200);
    machinesPage.waitForPage();

    // check details page
    machinesPage.list().details(this.machineName, 2).find('a').click();
    cy.contains('secretName2').should('be.visible');
  });

  it('can download YAML', function() {
    MachinesPagePo.navTo();
    machinesPage.waitForPage();
    machinesPage.list().actionMenu(this.machineName).getMenuItem('Download YAML').click({ force: true });

    const downloadedFilename = path.join(downloadsFolder, `${ this.machineName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
      expect(obj.metadata.name).to.equal(this.machineName);
      expect(obj.kind).to.equal('Machine');
    });
  });

  it('can delete a Machine', function() {
    MachinesPagePo.navTo();
    machinesPage.waitForPage();
    machinesPage.list().actionMenu(this.machineName).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    const machineName = `${ nsName }/${ this.machineName }`;

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machines/${ machineName }`).as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    machinesPage.waitForPage();

    cy.getRancherResource('v1', 'cluster.x-k8s.io.machines', `${ machineName }`, 200).then((resp) => {
      // Resource gets updated post create (finalizer added). So refetch it to get the correct resourceVersion
      const resource = resp.body;

      delete resource.metadata.finalizers;
      cy.setRancherResource('v1', 'cluster.x-k8s.io.machines', `${ machineName }`, resource);
    });

    // check list details
    cy.contains(this.machineName).should('not.exist');
  });
});
