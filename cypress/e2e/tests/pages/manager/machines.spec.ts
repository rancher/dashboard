import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import MachinesPagePo from '@/cypress/e2e/po/pages/cluster-manager/machines.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('Machines', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const machinesPage = new MachinesPagePo('_');
  const runTimestamp = +new Date();
  const machineName = `e2e-machine-name-${ runTimestamp }`;
  const nsName = 'default';
  let resourceVersion = '';
  let creationTimestamp = '';
  let time = '';
  let uid = '';

  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  it('can create a Machine', () => {
    MachinesPagePo.navTo();
    machinesPage.waitForPage();
    machinesPage.create();

    machinesPage.createEditMachines().waitForPage('as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machines.yml').then((machineDoc) => {
      // convert yaml into json to update name value
      const json: any = jsyaml.load(machineDoc);

      json.metadata.name = machineName;
      json.metadata.namespace = nsName;
      json.spec.bootstrap.clusterName = 'local';
      json.spec.bootstrap.dataSecretName = 'secretName';

      machinesPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('POST', '/v1/cluster.x-k8s.io.machines').as('createMachine');
    machinesPage.createEditMachines().saveCreateForm().click();
    cy.wait('@createMachine').then((req) => {
      resourceVersion = req.response?.body.metadata.resourceVersion;
      creationTimestamp = req.response?.body.metadata.creationTimestamp;
      time = req.response?.body.metadata.managedFields[0].time;
      uid = req.response?.body.metadata.uid;
    });
    machinesPage.waitForPage();
    machinesPage.list().details(machineName, 1).should('be.visible');
  });

  it('can edit a Machine', () => {
    MachinesPagePo.navTo();
    machinesPage.list().actionMenu(machineName).getMenuItem('Edit YAML').click();
    machinesPage.createEditMachines(nsName, machineName).waitForPage('mode=edit&as=yaml');

    cy.readFile('cypress/e2e/blueprints/cluster_management/machines-edit.yml').then((machineDoc) => {
      // convert yaml into json to update values
      const json: any = jsyaml.load(machineDoc);

      json.spec.bootstrap.dataSecretName = 'secretName2';
      json.metadata.creationTimestamp = creationTimestamp;
      json.metadata.managedFields.time = time;
      json.metadata.uid = uid;
      json.metadata.name = machineName;
      json.metadata.resourceVersion = resourceVersion;
      machinesPage.yamlEditor().set(jsyaml.dump(json));
    });

    cy.intercept('PUT', `/v1/cluster.x-k8s.io.machines/${ nsName }/${ machineName }`).as('updateMachine');
    machinesPage.createEditMachines().saveCreateForm().click();
    cy.wait('@updateMachine').its('response.statusCode').should('eq', 200);
    machinesPage.waitForPage();

    // check details page
    machinesPage.list().details(machineName, 2).find('a').click();
    cy.contains('secretName2').should('be.visible');
  });

  it('can download YAML', () => {
    MachinesPagePo.navTo();
    machinesPage.list().actionMenu(machineName).getMenuItem('Download YAML').click();

    const downloadedFilename = path.join(downloadsFolder, `${ machineName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('cluster.x-k8s.io/v1beta1');
      expect(obj.metadata.name).to.equal(machineName);
      expect(obj.kind).to.equal('Machine');
    });
  });

  it('can delete a Machine', () => {
    MachinesPagePo.navTo();
    machinesPage.list().actionMenu(machineName).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/cluster.x-k8s.io.machines/${ nsName }/${ machineName }`).as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    machinesPage.waitForPage();

    // check list details
    cy.contains(machineName).should('not.exist');
  });
});
