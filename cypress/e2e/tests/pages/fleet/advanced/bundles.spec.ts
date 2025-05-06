import { FleetBundlesListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.bundle.po';
import FleetBundleDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.bundle.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
// import { EXTRA_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const bundle = 'fleet-agent-local';
const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customBundleName = '';
let removeBundle = false;
const bundlesNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Bundles', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetBundles = new FleetBundlesListPagePo();
  const headerPo = new HeaderPo();

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate bundles table in empty state', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundles.sharedComponents().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });

    it('check table headers are available in list and details view', () => {
      FleetBundlesListPagePo.navTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Deployments', 'Age'];

      fleetBundles.sharedComponents().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet bundle details
      fleetBundles.sharedComponents().goToDetailsPage(bundle);

      const fleetBundleeDetailsPage = new FleetBundleDetailsPo(localWorkspace, bundle);

      fleetBundleeDetailsPage.waitForPage();

      // check table headers
      const expectedHeadersDetailsViewEvents = ['State', 'Cluster', 'API Version', 'Kind', 'Name', 'Namespace'];

      fleetBundleeDetailsPage.list().resourceTable().sortableTable()
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

      fleetBundles.goTo();
      fleetBundles.waitForPage();
      fleetBundles.sharedComponents().baseResourceList().masthead().title()
        .should('contain', 'Bundles');
      headerPo.selectWorkspace(localWorkspace);
      fleetBundles.sharedComponents().baseResourceList().masthead().createYaml();
      fleetBundles.createBundlesForm().waitForPage('as=yaml');
      fleetBundles.createBundlesForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Bundle: Create');
      });
      fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
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

          fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundles.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createBundle').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeBundle = true;
        bundlesNameList.push(customBundleName);
      });
      fleetBundles.waitForPage();
      fleetBundles.sharedComponents().list().rowWithName(customBundleName).checkVisible();
      // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/14146
      // fleetBundles.sharedComponents().resourceTableDetails(customBundleName, 3 ).contains(/^1$/, EXTRA_LONG_TIMEOUT_OPT);
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    it.skip('can Edit Config', () => {
      cy.intercept('PUT', `/v1/fleet.cattle.io.bundles/${ localWorkspace }/${ customBundleName }`).as('editBundle');

      fleetBundles.goTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundles.sharedComponents().list().actionMenu(customBundleName).getMenuItem('Edit YAML')
        .click();
      fleetBundles.createBundlesForm(localWorkspace, customBundleName).waitForPage('mode=edit&as=yaml');
      fleetBundles.createBundlesForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Bundle: ${ customBundleName }`);
      });
      fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.namespace = localWorkspace;

          fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });
      fleetBundles.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@editBundle').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata.namespace).equals(localWorkspace);
      });
      fleetBundles.waitForPage();
    });

    it('can clone a bundle', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.bundles').as('cloneBundle');

      fleetBundles.goTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundles.sharedComponents().list().actionMenu(customBundleName).getMenuItem('Clone')
        .click();
      fleetBundles.createBundlesForm(localWorkspace, customBundleName).waitForPage('mode=clone&as=yaml');
      fleetBundles.createBundlesForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Bundle: Clone from ${ customBundleName }`);
      });
      fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customBundleName }-clone`;

          fleetBundles.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundles.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneBundle').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetBundles.waitForPage();
      fleetBundles.sharedComponents().list().rowWithName(`${ customBundleName }-clone`).checkVisible();
      // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/14146
      // fleetBundles.sharedComponents().resourceTableDetails(`${ customBundleName }-clone`, 3 ).contains(/^1$/, EXTRA_LONG_TIMEOUT_OPT);
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetBundles.goTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundles.sharedComponents().list().actionMenu(customBundleName).getMenuItem('Download YAML')
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
      fleetBundles.goTo();
      fleetBundles.waitForPage();
      headerPo.selectWorkspace(localWorkspace);
      fleetBundles.sharedComponents().list().actionMenu(`${ customBundleName }-clone`).getMenuItem('Delete')
        .click();
      fleetBundles.sharedComponents().list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.bundles/${ localWorkspace }/${ customBundleName }-clone`).as('deleteBundle');

          promptRemove.remove();
          cy.wait('@deleteBundle');
          fleetBundles.waitForPage();
          fleetBundles.sharedComponents().list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetBundles.sharedComponents().list().resourceTable().sortableTable()
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
