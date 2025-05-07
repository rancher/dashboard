import { FleetGitRepoRestrictionListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitreporestriction.po';
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
  const fleetRestrictionsPage = new FleetGitRepoRestrictionListPagePo();
  const headerPo = new HeaderPo();

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    before(() => {
      cy.login();
      cy.createE2EResourceName('fleet-restriction').then((name) => {
        customRestrictionName = name;
      });
    });

    it('can create a gitrepo restriction', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.gitreporestrictions').as('createRestriction');

      fleetRestrictionsPage.goTo();
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().baseResourceList().masthead().title()
        .should('contain', 'GitRepoRestrictions');
      headerPo.selectWorkspace(defaultWorkspace);
      fleetRestrictionsPage.sharedComponents().baseResourceList().masthead().createYaml();
      fleetRestrictionsPage.createRestrictionForm().waitForPage('as=yaml');
      fleetRestrictionsPage.createRestrictionForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('GitRepoRestriction: Create');
      });
      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
        // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = customRestrictionName;

          fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@createRestriction').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeRestriction = true;
        restrictionNameList.push(customRestrictionName);
      });
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().rowWithName(customRestrictionName).checkVisible();
    });

    // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/13990
    it.skip('can Edit Config', () => {
      cy.intercept('PUT', `/v1/fleet.cattle.io.gitreporestrictions/${ defaultWorkspace }/${ customRestrictionName }`).as('editRestriction');

      fleetRestrictionsPage.goTo();
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().actionMenu(customRestrictionName).getMenuItem('Edit YAML')
        .click();
      fleetRestrictionsPage.createRestrictionForm(defaultWorkspace, customRestrictionName).waitForPage('mode=edit&as=yaml');
      fleetRestrictionsPage.createRestrictionForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`GitRepoRestriction: ${ customRestrictionName }`);
      });
      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.namespace = localWorkspace;

          fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });
      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@editRestriction').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata.namespace).equals(localWorkspace);
      });
      fleetRestrictionsPage.waitForPage();
    });

    it('can clone a gitrepo restriction', () => {
      cy.intercept('POST', '/v1/fleet.cattle.io.gitreporestrictions').as('cloneRestriction');

      fleetRestrictionsPage.goTo();
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().actionMenu(customRestrictionName).getMenuItem('Clone')
        .click();
      fleetRestrictionsPage.createRestrictionForm(defaultWorkspace, customRestrictionName).waitForPage('mode=clone&as=yaml');
      fleetRestrictionsPage.createRestrictionForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`GitRepoRestriction: Clone from ${ customRestrictionName }`);
      });
      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
        .value()
        .then((val) => {
          // convert yaml into json to update values
          const json: any = jsyaml.load(val);

          json.metadata.name = `${ customRestrictionName }-clone`;

          fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().codeMirror()
            .set(jsyaml.dump(json));
        });

      fleetRestrictionsPage.sharedComponents().resourceDetail().resourceYaml().saveOrCreate()
        .click();
      cy.wait('@cloneRestriction').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().rowWithName(`${ customRestrictionName }-clone`).checkVisible();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetRestrictionsPage.goTo();
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().actionMenu(customRestrictionName).getMenuItem('Download YAML')
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
      fleetRestrictionsPage.goTo();
      fleetRestrictionsPage.waitForPage();
      fleetRestrictionsPage.sharedComponents().list().actionMenu(`${ customRestrictionName }-clone`).getMenuItem('Delete')
        .click();
      fleetRestrictionsPage.sharedComponents().list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/fleet.cattle.io.gitreporestrictions/${ defaultWorkspace }/${ customRestrictionName }-clone`).as('deleteRestriction');

          promptRemove.remove();
          cy.wait('@deleteRestriction');
          fleetRestrictionsPage.waitForPage();
          fleetRestrictionsPage.sharedComponents().list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetRestrictionsPage.sharedComponents().list().resourceTable().sortableTable()
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
