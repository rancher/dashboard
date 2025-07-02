import { FleetGitRepoRestrictionListPagePo, FleetRestrictionCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitreporestriction.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const localWorkspace = 'fleet-local';
const defaultWorkspace = 'fleet-default';
let customRestrictionName = '';
let removeRestriction = false;
const restrictionNameList = [];
const downloadsFolder = Cypress.config('downloadsFolder');

describe('GitRepo Restrictions', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetRestrictionsListPage = new FleetGitRepoRestrictionListPagePo();
  const headerPo = new HeaderPo();

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-restriction').then((name) => {
        customRestrictionName = name;
      });
    });

    it('can create a gitrepo restriction', () => {
      const fleetRestrictionCreateEditPage = new FleetRestrictionCreateEditPo();

      cy.intercept('POST', '/v1/fleet.cattle.io.gitreporestrictions').as('createRestriction');

      fleetRestrictionsListPage.goTo();
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.baseResourceList().masthead().title()
        .should('contain', 'GitRepoRestrictions');
      headerPo.selectWorkspace(defaultWorkspace);
      fleetRestrictionsListPage.baseResourceList().masthead().createYaml();
      fleetRestrictionCreateEditPage.waitForPage('as=yaml');
      fleetRestrictionCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('GitRepoRestriction: Create');
      });
      fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customRestrictionName;

          fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createRestriction').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeRestriction = true;
        restrictionNameList.push(customRestrictionName);
      });
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.list().rowWithName(customRestrictionName).checkVisible();
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    // it.skip('can Edit Config', () => {
    //   const fleetRestrictionCreateEditPage = new FleetRestrictionCreateEditPo(defaultWorkspace, customRestrictionName);

    //   cy.intercept('PUT', `/v1/fleet.cattle.io.gitreporestrictions/${ defaultWorkspace }/${ customRestrictionName }`).as('editRestriction');

    //   fleetRestrictionsListPage.goTo();
    //   fleetRestrictionsListPage.waitForPage();
    //   fleetRestrictionsListPage.list().actionMenu(customRestrictionName).getMenuItem('Edit YAML')
    //     .click();
    //   fleetRestrictionCreateEditPage.waitForPage('mode=edit&as=yaml');
    //   fleetRestrictionCreateEditPage.mastheadTitle().then((title) => {
    //     expect(title.replace(/\s+/g, ' ')).to.contain(`GitRepoRestriction: ${ customRestrictionName }`);
    //   });
    //   fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //     .value()
    //     .then((val) => {
    //       // convert yaml into json to update values
    //       const json: any = jsyaml.load(val);

    //       json.metadata.namespace = localWorkspace;

    //       fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
    //         .set(jsyaml.dump(json));
    //     });
    //   fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
    //     .click();
    //   cy.wait('@editRestriction').then(({ response }) => {
    //     expect(response?.statusCode).to.eq(200);
    //     expect(response?.body.metadata.namespace).equals(localWorkspace);
    //   });
    //   fleetRestrictionsListPage.waitForPage();
    // });

    it('can clone a gitrepo restriction', () => {
      const fleetRestrictionCreateEditPage = new FleetRestrictionCreateEditPo(defaultWorkspace, customRestrictionName);

      cy.intercept('POST', '/v1/fleet.cattle.io.gitreporestrictions').as('cloneRestriction');

      fleetRestrictionsListPage.goTo();
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.list().actionMenu(customRestrictionName).getMenuItem('Clone')
        .click();
      fleetRestrictionCreateEditPage.waitForPage('mode=clone&as=yaml');
      fleetRestrictionCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`GitRepoRestriction: Clone from ${ customRestrictionName }`);
      });
      fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customRestrictionName }-clone`;

          fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetRestrictionCreateEditPage.resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneRestriction').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.list().rowWithName(`${ customRestrictionName }-clone`).checkVisible();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetRestrictionsListPage.goTo();
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.list().actionMenu(customRestrictionName).getMenuItem('Download YAML')
        .click();

      const downloadedFilename = path.join(downloadsFolder, `${ customRestrictionName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('GitRepoRestriction');
        expect(obj.metadata['name']).to.equal(customRestrictionName);
      });
    });

    it('can delete a gitrepo restriction', () => {
      fleetRestrictionsListPage.goTo();
      fleetRestrictionsListPage.waitForPage();
      fleetRestrictionsListPage.list().actionMenu(`${ customRestrictionName }-clone`).getMenuItem('Delete')
        .click();
      fleetRestrictionsListPage.list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.gitreporestrictions/${ defaultWorkspace }/${ customRestrictionName }-clone`).as('deleteRestriction');

          promptRemove.remove();
          cy.wait('@deleteRestriction');
          fleetRestrictionsListPage.waitForPage();
          fleetRestrictionsListPage.list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetRestrictionsListPage.list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', `${ customRestrictionName }-clone`);
        });
    });

    after('clean up', () => {
      if (removeRestriction) {
        restrictionNameList.forEach((r) => cy.deleteRancherResource('v1', `fleet.cattle.io.gitreporestrictions/${ defaultWorkspace }`, r, false));
      }
    });
  });
});
