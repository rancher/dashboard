import UsersAndAuthPo from '~/cypress/e2e/po/pages/users-and-auth/users-and-auth.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

const userRoles = new UsersAndAuthPo('_', 'roles', undefined);
const usersAdmin = new UsersAndAuthPo('_', 'management.cattle.io.user', undefined);

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;
const downloadsFolder = Cypress.config('downloadsFolder');
const standardUsername = `${ runPrefix }-standard-user`;
const standardPassword = 'standardUser-password';
const userBaseUsername = `${ runPrefix }-userBase-user`;

let userId: string;

describe('Users and Authentication', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Users', () => {
    it('can create Admin', () => {
      const adminUsername = `${ runPrefix }-admin-user`;
      const adminPassword = 'admin-password';

      usersAdmin.goTo();
      usersAdmin.listCreate();

      usersAdmin.username().set(adminUsername);
      usersAdmin.newPass().set(adminPassword);
      usersAdmin.confirmNewPass().set(adminPassword);
      usersAdmin.selectCheckbox('Administrator').set();
      usersAdmin.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
    });

    it('can create Restricted Admin', () => {
      const restrictedAdminUsername = `${ runPrefix }-restrictedAdmin-user`;
      const restrictedAdminPassword = 'restrictedAdmin-password';

      usersAdmin.goTo();
      usersAdmin.listCreate();

      usersAdmin.username().set(restrictedAdminUsername);
      usersAdmin.newPass().set(restrictedAdminPassword);
      usersAdmin.confirmNewPass().set(restrictedAdminPassword);
      usersAdmin.selectCheckbox('Restricted Administrator').set();
      usersAdmin.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
    });

    it('can create User-Base', () => {
      const userBasePassword = 'userBase-password';

      usersAdmin.goTo();
      usersAdmin.listCreate();

      usersAdmin.username().set(userBaseUsername);
      usersAdmin.newPass().set(userBasePassword);
      usersAdmin.confirmNewPass().set(userBasePassword);
      usersAdmin.selectCheckbox('User-Base').set();
      usersAdmin.saveAndWaitForRequests('POST', '/v3/globalrolebindings');

      usersAdmin.goTo();
      usersAdmin.waitForPage();
      usersAdmin.listElementWithName(userBaseUsername).should('be.visible');
    });

    it('can create Standard User and view their details', () => {
      usersAdmin.goTo();
      usersAdmin.listCreate();

      usersAdmin.username().set(standardUsername);
      usersAdmin.newPass().set(standardPassword);
      usersAdmin.confirmNewPass().set(standardPassword);

      // verify standard user checkbox selected by default
      usersAdmin.selectCheckbox('Standard User').isChecked();
      usersAdmin.saveAndWaitForRequests('POST', '/v3/globalrolebindings').then((res) => {
        userId = res.response?.body.userId;

        // view user's details
        usersAdmin.goTo();
        usersAdmin.waitForPage();
        usersAdmin.listDetails(standardUsername, 2).find('a').click();

        const userDetails = new UsersAndAuthPo('_', 'management.cattle.io.user', userId);

        userDetails.waitForPage();
        cy.contains(`User: ${ standardUsername }`);
      });
      usersAdmin.goTo();
      usersAdmin.waitForPage();
      usersAdmin.listElementWithName(standardUsername).should('be.visible');
    });

    it('can Refresh Group Memberships', () => {
      // Refresh Group Membership and verify request is made
      usersAdmin.goTo();
      cy.intercept('POST', '/v3/users?action=refreshauthprovideraccess').as('refreshGroup');
      usersAdmin.listRefreshGroupMembership().click();
      cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
    });

    describe('Action Menu', () => {
      it('can Deactivate and Activate user', () => {
        // Deactivate user and check state is Inactive
        usersAdmin.goTo();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Deactivate');
        usersAdmin.listDetails(standardUsername, 1).should('include.text', 'Inactive');

        // Activate user and check state is Active
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Activate');
        usersAdmin.listDetails(standardUsername, 1).should('include.text', 'Active');
      });

      it('can Refresh Group Memberships', () => {
        // Refresh Group Membership and verify request is made
        cy.intercept('POST', `/v3/users/${ userId }?action=refreshauthprovideraccess`).as('refreshGroup');
        usersAdmin.waitForRequests();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Refresh Group Memberships');
        cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
      });

      it('can Edit Config', () => {
        // Edit user and make sure edit is saved
        const userEdit = new UsersAndAuthPo('_', 'management.cattle.io.user', userId);

        usersAdmin.goTo();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Edit Config');
        userEdit.waitForPage('mode=edit');
        cy.contains(`User: ${ standardUsername }`);
        usersAdmin.description().set('e2e_test');
        userRoles.saveAndWaitForRequests('PUT', `/v3/users/${ userId }`).then((res) => {
          expect(res.response?.statusCode).to.equal(200);
          expect(res.response?.body.description).to.equal('e2e_test');
        });
      });

      it('can View YAML', () => {
        // View YAML and verify user lands on correct page
        const viewYaml = new UsersAndAuthPo('_', 'management.cattle.io.user', userId);

        usersAdmin.goTo();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'View YAML');
        viewYaml.waitForPage('mode=view&as=yaml');
        cy.contains(`User: ${ standardUsername }`);
      });

      it('can Download YAML', () => {
        // Download YAML and verify file exists
        const downloadedFilename = path.join(downloadsFolder, `${ standardUsername }.yaml`);

        usersAdmin.goTo();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Download YAML');
        cy.readFile(downloadedFilename).should('exist').then((buffer) => {
          const obj: any = jsyaml.load(buffer);

          // Basic checks on the downloaded YAML
          expect(obj.username).to.equal(standardUsername);
          expect(obj.apiVersion).to.equal('management.cattle.io/v3');
          expect(obj.kind).to.equal('User');
        });
      });

      it('can Delete user', () => {
        // Delete user and verify user is removed from list
        usersAdmin.goTo();
        usersAdmin.clickRowActionMenuItem(standardUsername, 'Delete');

        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
        promptRemove.confirm(standardUsername);
        promptRemove.remove();
        cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
        usersAdmin.listElementWithName(standardUsername).should('not.exist');
      });
    });

    describe('Bulk Actions', () => {
      it('can Deactivate and Activate users', () => {
        // Deactivate user and check state is Inactive
        cy.intercept('PUT', '/v3/users/*').as('updateUsers');
        usersAdmin.waitForRequests();
        usersAdmin.selectAll().set();
        usersAdmin.listDeactivate().click();
        cy.wait('@updateUsers');
        cy.contains('Inactive');
        usersAdmin.listDetails('admin', 1).should('include.text', 'Active');
        usersAdmin.listDetails(userBaseUsername, 1).should('include.text', 'Inactive');

        // Activate user and check state is Active
        usersAdmin.listActivate().click();
        cy.wait('@updateUsers');
        usersAdmin.listDetails(userBaseUsername, 1).should('include.text', 'Active');
      });

      it('can Download YAML', () => {
        // Download YAML and verify file exists
        usersAdmin.waitForRequests();
        usersAdmin.selectAll().set();
        usersAdmin.openBulkActionDropdown();

        cy.intercept('GET', '/v1/management.cattle.io.users/*').as('downloadYaml');
        usersAdmin.bulkActionButton('Download YAML').click();
        cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
        const downloadedFilename = path.join(downloadsFolder, 'resources.zip');

        cy.readFile(downloadedFilename).should('exist');
      });

      it('can Delete user', () => {
        // Delete user and verify user is removed from list
        usersAdmin.waitForRequests();
        usersAdmin.listElementWithName(userBaseUsername).click();
        usersAdmin.openBulkActionDropdown();
        usersAdmin.bulkActionButton('Delete').click();
        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
        promptRemove.confirm(userBaseUsername);
        promptRemove.remove();
        cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
        usersAdmin.listElementWithName(userBaseUsername).should('not.exist');
      });
    });
  });

  describe('Role Templates', () => {
    it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
      const customRoleName = `${ runPrefix }-my-custom-role`;
      const standardUsername = `${ runPrefix }-standard-user-e2e`;
      const standardPassword = 'standard-password';

      // create global role
      userRoles.goTo();
      userRoles.listCreate();

      userRoles.name().set(customRoleName);
      userRoles.selectVerbs(0, 3);
      userRoles.selectVerbs(0, 4);
      userRoles.selectResourcesByLabelValue(0, 'GlobalRoles');
      userRoles.saveAndWaitForRequests('POST', '/v3/globalroles');

      // create standard user
      usersAdmin.goTo();
      usersAdmin.listCreate();

      usersAdmin.username().set(standardUsername);
      usersAdmin.newPass().set(standardPassword);
      usersAdmin.confirmNewPass().set(standardPassword);
      usersAdmin.selectCheckbox(customRoleName).set();
      usersAdmin.saveAndWaitForRequests('POST', '/v3/globalrolebindings', true);

      // let's just check that the user is on the list view before attempting to login
      usersAdmin.goTo();
      usersAdmin.waitForPage();
      usersAdmin.listElementWithName(standardUsername).should('exist');

      // logout admin
      cy.logout();

      // login as standard user
      cy.login(standardUsername, standardPassword);

      // navigate to the roles page and make sure user can see it
      userRoles.goTo();
      userRoles.listTitle().should('contain', 'Role Templates');
      userRoles.listElements().should('have.length.of.at.least', 1);

      // navigate to the users page and make sure user can see it
      usersAdmin.waitForRequests();
      usersAdmin.listTitle().should('contain', 'Users');
      usersAdmin.listElements().should('have.length', 1);
    });
  });
});
