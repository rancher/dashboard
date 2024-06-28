import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as jsyaml from 'js-yaml';
import * as path from 'path';

const usersPo = new UsersPo('_');
const userCreate = usersPo.createEdit();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;
const downloadsFolder = Cypress.config('downloadsFolder');
const standardUsername = `${ runPrefix }-standard-user`;
const standardPassword = 'standardUser-password';
const userBaseUsername = `${ runPrefix }-userBase-user`;

let userId: string;

describe('Users', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('can create Admin', () => {
    const adminUsername = `${ runPrefix }-admin-user`;
    const adminPassword = 'admin-password';

    usersPo.goTo();
    usersPo.list().create();

    userCreate.waitForPage();
    userCreate.username().set(adminUsername);
    userCreate.newPass().set(adminPassword);
    userCreate.confirmNewPass().set(adminPassword);
    userCreate.selectCheckbox('Administrator').set();
    userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
  });

  it('can create Restricted Admin', () => {
    const restrictedAdminUsername = `${ runPrefix }-restrictedAdmin-user`;
    const restrictedAdminPassword = 'restrictedAdmin-password';

    usersPo.goTo();
    usersPo.list().create();

    userCreate.waitForPage();
    userCreate.username().set(restrictedAdminUsername);
    userCreate.newPass().set(restrictedAdminPassword);
    userCreate.confirmNewPass().set(restrictedAdminPassword);
    userCreate.selectCheckbox('Restricted Administrator').set();
    userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');
  });

  it('can create User-Base', () => {
    const userBasePassword = 'userBase-password';

    usersPo.goTo();
    usersPo.list().create();

    userCreate.waitForPage();
    userCreate.username().set(userBaseUsername);
    userCreate.newPass().set(userBasePassword);
    userCreate.confirmNewPass().set(userBasePassword);
    userCreate.selectCheckbox('User-Base').set();
    userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings');

    usersPo.waitForPage();
    usersPo.list().elementWithName(userBaseUsername).scrollIntoView().should('be.visible');
  });

  it('can create Standard User and view their details', () => {
    usersPo.goTo();
    usersPo.list().create();

    userCreate.username().set(standardUsername);
    userCreate.newPass().set(standardPassword);
    userCreate.confirmNewPass().set(standardPassword);

    // verify standard user checkbox selected by default
    userCreate.selectCheckbox('Standard User').isChecked();

    userCreate.saveAndWaitForRequests('POST', '/v3/globalrolebindings').then((res) => {
      userId = res.response?.body.userId;

      usersPo.waitForPage();
      usersPo.list().elementWithName(standardUsername).scrollIntoView().should('be.visible');

      // view user's details
      usersPo.list().details(standardUsername, 2).find('a').click();

      const userDetails = usersPo.detail(userId);

      userDetails.waitForPage();
      userDetails.mastheadTitle().should('contain', standardUsername);
    });
  });

  it('can Refresh Group Memberships', () => {
    // Refresh Group Membership and verify request is made
    usersPo.goTo();
    cy.intercept('POST', '/v3/users?action=refreshauthprovideraccess').as('refreshGroup');
    usersPo.list().refreshGroupMembership().click();
    cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
  });

  describe('Action Menu', () => {
    it('can Deactivate and Activate user', () => {
      // Deactivate user and check state is Inactive
      usersPo.goTo();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Disable');
      usersPo.list().details(standardUsername, 1).find('i').should('have.class', 'icon-user-xmark');

      // Activate user and check state is Active
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Enable');
      usersPo.list().details(standardUsername, 1).find('i').should('have.class', 'icon-user-check');
    });

    it('can Refresh Group Memberships', () => {
      // Refresh Group Membership and verify request is made
      cy.intercept('POST', `/v3/users/${ userId }?action=refreshauthprovideraccess`).as('refreshGroup');
      usersPo.waitForRequests();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Refresh Group Memberships');
      cy.wait('@refreshGroup').its('response.statusCode').should('eq', 200);
    });

    it('can Edit Config', () => {
      // Edit user and make sure edit is saved
      const userEdit = usersPo.createEdit(userId);

      usersPo.waitForRequests();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Edit Config');
      userEdit.waitForPage();
      userEdit.mastheadTitle().should('contain', standardUsername);
      const mgmtUserEditPo = new MgmtUserEditPo();

      mgmtUserEditPo.description().set('e2e_test');
      mgmtUserEditPo.saveAndWaitForRequests('PUT', `/v3/users/${ userId }`).then((res) => {
        expect(res.response?.statusCode).to.equal(200);
        expect(res.response?.body.description).to.equal('e2e_test');
      });
    });

    it('can View YAML', () => {
      // View YAML and verify user lands on correct page

      // We don't have a good pattern for the view/edit yaml page yet
      const viewYaml = usersPo.createEdit(userId);

      usersPo.goTo();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'View YAML');
      cy.url().should('include', `?mode=view&as=yaml`);
      viewYaml.mastheadTitle().should('contain', standardUsername);
    });

    it('can Download YAML', () => {
      // Download YAML and verify file exists
      const downloadedFilename = path.join(downloadsFolder, `${ standardUsername }.yaml`);

      usersPo.goTo();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Download YAML');
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
      usersPo.goTo();
      usersPo.list().clickRowActionMenuItem(standardUsername, 'Delete');

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
      promptRemove.confirm(standardUsername);
      promptRemove.remove();
      cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
      usersPo.list().elementWithName(standardUsername).should('not.exist');
    });
  });

  describe('Bulk Actions', () => {
    it('can Deactivate and Activate users', () => {
      // Deactivate user and check state is Inactive
      cy.intercept('PUT', '/v3/users/*').as('updateUsers');
      usersPo.waitForRequests();
      usersPo.list().selectAll().set();
      usersPo.list().deactivate().click();
      cy.wait('@updateUsers');
      usersPo.list().details('admin', 1).find('i').should('have.class', 'icon-user-check');
      usersPo.list().details(userBaseUsername, 1).find('i').should('have.class', 'icon-user-xmark');

      // Activate user and check state is Active
      usersPo.list().activate().click();
      cy.wait('@updateUsers');
      usersPo.list().details(userBaseUsername, 1).find('i').should('have.class', 'icon-user-check');
    });

    it('can Download YAML', () => {
      // Download YAML and verify file exists
      usersPo.waitForRequests();
      usersPo.list().selectAll().set();
      usersPo.list().openBulkActionDropdown();

      cy.intercept('GET', '/v1/management.cattle.io.users/*').as('downloadYaml');
      usersPo.list().bulkActionButton('Download YAML').click({ force: true });
      cy.wait('@downloadYaml', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
      const downloadedFilename = path.join(downloadsFolder, 'resources.zip');

      cy.readFile(downloadedFilename).should('exist');
    });

    it('can Delete user', () => {
      // Delete user and verify user is removed from list
      usersPo.waitForRequests();
      usersPo.list().elementWithName(userBaseUsername).click();
      usersPo.list().openBulkActionDropdown();
      usersPo.list().bulkActionButton('Delete').click({ force: true });
      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', '/v3/users/*').as('deleteUser');
      promptRemove.confirm(userBaseUsername);
      promptRemove.remove();
      cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
      usersPo.list().elementWithName(userBaseUsername).should('not.exist');
    });
  });
});
