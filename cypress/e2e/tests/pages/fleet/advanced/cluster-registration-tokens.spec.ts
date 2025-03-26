import { FleetClusterRegistrationTokenListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clusterregistrationtoken.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { clusterRegistrationTokensNoData, generateclusterRegistrationTokensDataSmall } from '@/cypress/e2e/blueprints/fleet/cluster-registration-tokens-get';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customTokenName = '';
let removeToken = false;
const tokenNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Cluster Registration Tokens', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetTokensPage = new FleetClusterRegistrationTokenListPagePo();
  const headerPo = new HeaderPo();

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-token').then((name) => {
        customTokenName = name;
      });
    });

    it('can create a cluster registration token', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.clusterregistrationtokens').as('createToken');

      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().baseResourceList().masthead().title()
        .should('contain', 'Cluster Registration Tokens');
      headerPo.selectWorkspace(defaultWorkspace);
      fleetTokensPage.sharedComponents().baseResourceList().masthead().createYaml();
      fleetTokensPage.createTokenForm().waitForPage('as=yaml');
      fleetTokensPage.createTokenForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Cluster Registration Token: Create');
      });
      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customTokenName;

          fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createToken').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeToken = true;
        tokenNameList.push(customTokenName);
      });
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().rowWithName(customTokenName).checkVisible();
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    it.skip('can Edit Config', () => {
      cy.intercept('PUT', `/v1/fleet.cattle.io.clusterregistrationtokens/${ defaultWorkspace }/${ customTokenName }`).as('editToken');

      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().actionMenu(customTokenName).getMenuItem('Edit YAML')
        .click();
      fleetTokensPage.createTokenForm(defaultWorkspace, customTokenName).waitForPage('mode=edit&as=yaml');
      fleetTokensPage.createTokenForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Cluster Registration Token: ${ customTokenName }`);
      });
      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.namespace = localWorkspace;

          fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });
      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@editToken').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata.namespace).equals(localWorkspace);
      });
      fleetTokensPage.waitForPage();
    });

    it('can clone a cluster registration token', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.clusterregistrationtokens').as('cloneToken');

      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().actionMenu(customTokenName).getMenuItem('Clone')
        .click();
      fleetTokensPage.createTokenForm(defaultWorkspace, customTokenName).waitForPage('mode=clone&as=yaml');
      fleetTokensPage.createTokenForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Cluster Registration Token: Clone from ${ customTokenName }`);
      });
      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customTokenName }-clone`;

          fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetTokensPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneToken').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().rowWithName(`${ customTokenName }-clone`).checkVisible();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().actionMenu(customTokenName).getMenuItem('Download YAML')
        .click();

      const downloadedFilename = path.join(downloadsFolder, `${ customTokenName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('ClusterRegistrationToken');
        expect(obj.metadata['name']).to.equal(customTokenName);
      });
    });

    it('can delete a cluster registration token', () => {
      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      fleetTokensPage.sharedComponents().list().actionMenu(`${ customTokenName }-clone`).getMenuItem('Delete')
        .click();
      fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.clusterregistrationtokens/${ defaultWorkspace }/${ customTokenName }-clone`).as('deleteToken');

          promptRemove.remove();
          cy.wait('@deleteToken');
          fleetTokensPage.waitForPage();
          fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', `${ customTokenName }-clone`);
        });
    });

    after('clean up', () => {
      if (removeToken) {
        tokenNameList.forEach((r) => cy.deleteRancherResource('v1', `fleet.cattle.io.clusterregistrationtokens/${ defaultWorkspace }`, r, false));
      }
    });
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate cluster registration tokens table in empty state', () => {
      clusterRegistrationTokensNoData();
      fleetTokensPage.goTo();
      fleetTokensPage.waitForPage();
      cy.wait('@clusterRegistrationTokensNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
        .checkRowCount(true, 1);
    });

    it('validate cluster registration tokens table', () => {
      generateclusterRegistrationTokensDataSmall();
      FleetClusterRegistrationTokenListPagePo.navTo();
      fleetTokensPage.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensPage.sharedComponents().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });
  });
});
