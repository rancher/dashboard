import { FleetBundlesListPagePo, FleetBundleDetailsPo, FleetBundlesCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.bundle.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { EXTRA_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const bundle = 'fleet-agent-local';
const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customBundleName = '';
let removeBundle = false;
const bundlesNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Bundles', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetBundlesListPage = new FleetBundlesListPagePo();
  const headerPo = new HeaderPo();

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate bundles table in empty state', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundlesListPage.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundlesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });

    it('check table headers are available in list and details view', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundlesListPage.waitForPage();
      headerPo.selectWorkspace(localWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundlesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet bundle details
      fleetBundlesListPage.goToDetailsPage(bundle);

      const fleetBundlesDetailsPage = new FleetBundleDetailsPo(localWorkspace, bundle);

      fleetBundlesDetailsPage.waitForPage();

      // check table headers
      const expectedHeadersDetailsViewEvents = ['State', 'Name', 'Kind', 'Cluster', 'Namespace', 'API Version'];

      fleetBundlesDetailsPage.resourcesList().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewEvents[i]);
        });
    });
  });

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-bundle').then((name) => {
        customBundleName = name;
      });
    });

    it('can create a bundle', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.bundles').as('createBundle');
      const fleetBundleCreateEditPage = new FleetBundlesCreateEditPo();

      fleetBundlesListPage.goTo();
      fleetBundlesListPage.waitForPage();
      fleetBundlesListPage.baseResourceList().masthead().title()
        .should('contain', 'Bundles');
      headerPo.selectWorkspace(localWorkspace);
      fleetBundlesListPage.baseResourceList().masthead().createYaml();
      fleetBundleCreateEditPage.waitForPage('as=yaml');
      fleetBundleCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Bundle: Create');
      });
      fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customBundleName;
          // Ensure spec exists
          json.spec = json.spec || {};

          // Add targets block
          json.spec.targets = [
            {
              clusterName:     'local',
              clusterSelector: {
                matchExpressions: [
                  {
                    key:      'fleet.cattle.io/non-managed-agent',
                    operator: 'DoesNotExist'
                  }
                ]
              },
              ignore: {}
            }
          ];

          fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundleCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createBundle').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeBundle = true;
        bundlesNameList.push(customBundleName);
      });
      fleetBundlesListPage.waitForPage();
      fleetBundlesListPage.list().rowWithName(customBundleName).checkVisible();
      fleetBundlesListPage.resourceTableDetails(customBundleName, 3 ).contains(1, EXTRA_LONG_TIMEOUT_OPT);
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    // it.skip('can Edit Config', () => {
    //   const fleetBundleCreateEditPage = new FleetBundlesCreateEditPo(localWorkspace, customBundleName);

    //   cy.intercept('PUT', `/v1/fleet.cattle.io.bundles/${ localWorkspace }/${ customBundleName }`).as('editBundle');

    //   fleetBundlesListPage.goTo();
    //   fleetBundlesListPage.waitForPage();
    //   headerPo.selectWorkspace(localWorkspace);
    //   fleetBundlesListPage.list().actionMenu(customBundleName).getMenuItem('Edit YAML')
    //     .click();
    //   fleetBundleCreateEditPage.waitForPage('mode=edit&as=yaml');
    //   fleetBundleCreateEditPage.mastheadTitle().then((title) => {
    //     expect(title.replace(/\s+/g, ' ')).to.contain(`Bundle: ${ customBundleName }`);
    //   });
    //   fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //     .value()
    //     .then((val) => {
    //       // convert yaml into json to update values
    //       const json: any = jsyaml.load(val);

    //       json.metadata.namespace = localWorkspace;

    //       fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //         .set(jsyaml.dump(json));
    //     });
    //   fleetBundleCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
    //     .click();
    //   cy.wait('@editBundle').then(({ response }) => {
    //     expect(response?.statusCode).to.eq(200);
    //     expect(response?.body.metadata.namespace).equals(localWorkspace);
    //   });
    //   fleetBundlesListPage.waitForPage();
    // });

    it('can clone a bundle', () => {
      const fleetBundleCreateEditPage = new FleetBundlesCreateEditPo(localWorkspace, customBundleName);

      cy.intercept('POST', '/v1/fleet.cattle.io.bundles').as('cloneBundle');

      fleetBundlesListPage.goTo();
      fleetBundlesListPage.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundlesListPage.list().actionMenu(customBundleName).getMenuItem('Clone')
        .click();
      fleetBundleCreateEditPage.waitForPage('mode=clone&as=yaml');
      fleetBundleCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Bundle: Clone from ${ customBundleName }`);
      });
      fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customBundleName }-clone`;

          fleetBundleCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundleCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneBundle').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetBundlesListPage.waitForPage();
      fleetBundlesListPage.list().rowWithName(`${ customBundleName }-clone`).checkVisible();
      fleetBundlesListPage.resourceTableDetails(`${ customBundleName }-clone`, 3 ).contains(/^1$/, EXTRA_LONG_TIMEOUT_OPT);
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetBundlesListPage.goTo();
      fleetBundlesListPage.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundlesListPage.list().actionMenu(customBundleName).getMenuItem('Download YAML')
        .click();

      const downloadedFilename = path.join(downloadsFolder, `${ customBundleName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('Bundle');
        expect(obj.metadata['name']).to.equal(customBundleName);
      });
    });

    it('can delete a bundle', () => {
      fleetBundlesListPage.goTo();
      fleetBundlesListPage.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundlesListPage.list().actionMenu(`${ customBundleName }-clone`).getMenuItem('Delete')
        .click();
      fleetBundlesListPage.list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.bundles/${ localWorkspace }/${ customBundleName }-clone`).as('deleteBundle');

          promptRemove.remove();
          cy.wait('@deleteBundle');
          fleetBundlesListPage.waitForPage();
          fleetBundlesListPage.list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetBundlesListPage.list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', `${ customBundleName }-clone`);
        });
    });

    after('clean up', () => {
      if (removeBundle) {
        bundlesNameList.forEach((r) => cy.deleteRancherResource('v1', `fleet.cattle.io.bundles/${ localWorkspace }`, r, false));
      }
    });
  });
});
