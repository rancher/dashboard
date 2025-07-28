import { FleetClusterRegistrationTokenListPagePo, FleetTokensCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clusterregistrationtoken.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { clusterRegistrationTokensNoData, generateclusterRegistrationTokensDataSmall } from '@/cypress/e2e/blueprints/fleet/cluster-registration-tokens-get';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

// const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customTokenName = '';
let removeToken = false;
const tokenNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Cluster Registration Tokens', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetTokensListPage = new FleetClusterRegistrationTokenListPagePo();

  const headerPo = new HeaderPo();

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-token').then((name) => {
        customTokenName = name;
      });
    });

    it('can create a cluster registration token', () => {
      const fleetTokenCreateEditPage = new FleetTokensCreateEditPo();

      cy.intercept('POST', '/v1/fleet.cattle.io.clusterregistrationtokens').as('createToken');

      fleetTokensListPage.goTo();
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.baseResourceList().masthead().title()
        .should('contain', 'Cluster Registration Tokens');
      headerPo.selectWorkspace(defaultWorkspace);
      fleetTokensListPage.baseResourceList().masthead().createYaml();
      fleetTokenCreateEditPage.waitForPage('as=yaml');
      fleetTokenCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Cluster Registration Token: Create');
      });
      fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customTokenName;

          fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetTokenCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createToken').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeToken = true;
        tokenNameList.push(customTokenName);
      });
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.list().rowWithName(customTokenName).checkVisible();
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    // it.skip('can Edit Config', () => {
    //   const fleetTokenCreateEditPage = new FleetTokensCreateEditPo(defaultWorkspace, customTokenName);

    //   cy.intercept('PUT', `/v1/fleet.cattle.io.clusterregistrationtokens/${ defaultWorkspace }/${ customTokenName }`).as('editToken');

    //   fleetTokensListPage.goTo();
    //   fleetTokensListPage.waitForPage();
    //   fleetTokensListPage.list().actionMenu(customTokenName).getMenuItem('Edit YAML')
    //     .click();
    //   fleetTokenCreateEditPage.waitForPage('mode=edit&as=yaml');
    //   fleetTokenCreateEditPage.mastheadTitle().then((title) => {
    //     expect(title.replace(/\s+/g, ' ')).to.contain(`Cluster Registration Token: ${ customTokenName }`);
    //   });
    //   fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //     .value()
    //     .then((val) => {
    //       // convert yaml into json to update values
    //       const json: any = jsyaml.load(val);

    //       json.metadata.namespace = localWorkspace;

    //       fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //         .set(jsyaml.dump(json));
    //     });
    //   fleetTokenCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
    //     .click();
    //   cy.wait('@editToken').then(({ response }) => {
    //     expect(response?.statusCode).to.eq(200);
    //     expect(response?.body.metadata.namespace).equals(localWorkspace);
    //   });
    //   fleetTokensListPage.waitForPage();
    // });

    it('can clone a cluster registration token', () => {
      const fleetTokenCreateEditPage = new FleetTokensCreateEditPo(defaultWorkspace, customTokenName);

      cy.intercept('POST', '/v1/fleet.cattle.io.clusterregistrationtokens').as('cloneToken');

      fleetTokensListPage.goTo();
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.list().actionMenu(customTokenName).getMenuItem('Clone')
        .click();
      fleetTokenCreateEditPage.waitForPage('mode=clone&as=yaml');
      fleetTokenCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Cluster Registration Token: Clone from ${ customTokenName }`);
      });
      fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customTokenName }-clone`;

          fleetTokenCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetTokenCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneToken').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.list().rowWithName(`${ customTokenName }-clone`).checkVisible();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetTokensListPage.goTo();
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.list().actionMenu(customTokenName).getMenuItem('Download YAML')
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
      fleetTokensListPage.goTo();
      fleetTokensListPage.waitForPage();
      fleetTokensListPage.list().actionMenu(`${ customTokenName }-clone`).getMenuItem('Delete')
        .click();
      fleetTokensListPage.list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.clusterregistrationtokens/${ defaultWorkspace }/${ customTokenName }-clone`).as('deleteToken');

          promptRemove.remove();
          cy.wait('@deleteToken');
          fleetTokensListPage.waitForPage();
          fleetTokensListPage.list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetTokensListPage.list().resourceTable().sortableTable()
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

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate cluster registration tokens table in empty state', () => {
      clusterRegistrationTokensNoData();
      fleetTokensListPage.goTo();
      fleetTokensListPage.waitForPage();
      cy.wait('@clusterRegistrationTokensNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      fleetTokensListPage.list().resourceTable().sortableTable()
        .checkRowCount(true, 1);
    });

    it('validate cluster registration tokens table', () => {
      generateclusterRegistrationTokensDataSmall();
      FleetClusterRegistrationTokenListPagePo.navTo();
      fleetTokensListPage.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });
  });
});
