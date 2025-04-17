import { FleetBundleNamespaceMappingListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.bundlenamespacemapping.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customMappingName = '';
let removeMappings = false;
const mappingsNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Bundle Namespace Mappings', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetBundleNsMappingsPage = new FleetBundleNamespaceMappingListPagePo();
  const headerPo = new HeaderPo();

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-mapping').then((name) => {
        customMappingName = name;
      });
    });

    it('can create a bundle namespace mapping', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.bundlenamespacemappings').as('createMapping');

      fleetBundleNsMappingsPage.goTo();
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().baseResourceList().masthead().title()
        .should('contain', 'BundleNamespaceMappings');
      headerPo.selectWorkspace(defaultWorkspace);
      fleetBundleNsMappingsPage.sharedComponents().baseResourceList().masthead().createYaml();
      fleetBundleNsMappingsPage.createMappingForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('BundleNamespaceMapping: Create');
      });
      fleetBundleNsMappingsPage.createMappingForm().waitForPage('as=yaml');
      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customMappingName;

          fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createMapping').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeMappings = true;
        mappingsNameList.push(customMappingName);
      });
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().rowWithName(customMappingName).checkVisible();
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    it.skip('can Edit Config', () => {
      cy.intercept('PUT', `/v1/fleet.cattle.io.bundlenamespacemappings/${ defaultWorkspace }/${ customMappingName }`).as('editMapping');

      fleetBundleNsMappingsPage.goTo();
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().actionMenu(customMappingName).getMenuItem('Edit YAML')
        .click();
      fleetBundleNsMappingsPage.createMappingForm(defaultWorkspace, customMappingName).waitForPage('mode=edit&as=yaml');
      fleetBundleNsMappingsPage.createMappingForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`BundleNamespaceMapping: ${ customMappingName }`);
      });
      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.namespace = localWorkspace;

          fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });
      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@editMapping').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata.namespace).equals(localWorkspace);
      });
      fleetBundleNsMappingsPage.waitForPage();
    });

    it('can clone a bundle namespace mapping', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.bundlenamespacemappings').as('cloneMapping');

      fleetBundleNsMappingsPage.goTo();
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().actionMenu(customMappingName).getMenuItem('Clone')
        .click();
      fleetBundleNsMappingsPage.createMappingForm(defaultWorkspace, customMappingName).waitForPage('mode=clone&as=yaml');
      fleetBundleNsMappingsPage.createMappingForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`BundleNamespaceMapping: Clone from ${ customMappingName }`);
      });
      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customMappingName }-clone`;

          fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetBundleNsMappingsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneMapping').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().rowWithName(`${ customMappingName }-clone`).checkVisible();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetBundleNsMappingsPage.goTo();
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().actionMenu(customMappingName).getMenuItem('Download YAML')
        .click();

      const downloadedFilename = path.join(downloadsFolder, `${ customMappingName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('BundleNamespaceMapping');
        expect(obj.metadata['name']).to.equal(customMappingName);
      });
    });

    it('can delete a bundle namespace mapping', () => {
      fleetBundleNsMappingsPage.goTo();
      fleetBundleNsMappingsPage.waitForPage();
      fleetBundleNsMappingsPage.sharedComponents().list().actionMenu(`${ customMappingName }-clone`).getMenuItem('Delete')
        .click();
      fleetBundleNsMappingsPage.sharedComponents().list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.bundlenamespacemappings/${ defaultWorkspace }/${ customMappingName }-clone`).as('deleteMapping');

          promptRemove.remove();
          cy.wait('@deleteMapping');
          fleetBundleNsMappingsPage.waitForPage();
          fleetBundleNsMappingsPage.sharedComponents().list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetBundleNsMappingsPage.sharedComponents().list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', `${ customMappingName }-clone`);
        });
    });

    after('clean up', () => {
      if (removeMappings) {
        mappingsNameList.forEach((r) => cy.deleteRancherResource('v1', `fleet.cattle.io.bundlenamespacemappings/${ defaultWorkspace }`, r, false));
      }
    });
  });
});
