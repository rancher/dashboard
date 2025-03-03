import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';
import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import { generateUsersDataSmall } from '@/cypress/e2e/blueprints/users/users-get';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

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
    usersPo.waitForPage();
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Users & Authentication');
    usersPo.list().create();

    userCreate.waitForPage();
    userCreate.username().set(adminUsername);
    userCreate.newPass().set(adminPassword);
    userCreate.confirmNewPass().set(adminPassword);
    userCreate.selectCheckbox('Administrator').set();
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

  it('shows global roles in specific order', () => {
    // Intercept roles request and change the order
    cy.intercept('GET', `/v1/management.cattle.io.globalroles?*`, (req) => {
      req.continue((res) => {
        // Move the Administrator role to the end of the list
        const adminIndex = res.body.data.findIndex((item) => item.id === 'admin');
        const adminRole = res.body.data[adminIndex];

        res.body.data.splice(adminIndex, 1);
        res.body.data.push(adminRole);

        res.send(res.body);
      });
    });

    usersPo.goTo();
    usersPo.list().create();
    userCreate.waitForPage();

    const mgmtUserEditPo = new MgmtUserEditPo();

    mgmtUserEditPo.globalRoleBindings().globalOptions().then((list) => {
      expect(list.length).to.eq(3);
      expect(list[0]).to.eq('Administrator');
      expect(list[1]).to.eq('Standard User');
      expect(list[2]).to.eq('User-Base');
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
      usersPo.goTo();

      let menu = usersPo.list().actionMenu(standardUsername);

      // Deactivate user and check state is Inactive
      menu.checkVisible();
      menu.getMenuItem('Disable').click();
      menu.checkNotExists();

      usersPo.list().details(standardUsername, 1).find('i').should('have.class', 'icon-user-xmark');

      // Activate user and check state is Active
      menu = usersPo.list().actionMenu(standardUsername);
      menu.checkVisible();
      menu.getMenuItem('Enable').click();
      menu.checkNotExists();

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

  describe('List', { testIsolation: 'off', tags: ['@vai', '@adminUser'] }, () => {
    let uniqueUserName = SortableTablePo.firstByDefaultName('user');

    const userIdsList = [];
    let initialCount;

    before('set up', () => {
      cy.login();
      cy.getRancherResource('v3', 'users').then((resp: Cypress.Response<any>) => {
        initialCount = resp.body.data.length - 1;
      });
      cy.tableRowsPerPageAndNamespaceFilter(10, 'local', 'none', '{\"local\":[]}');

      // create users
      let i = 0;

      while (i < 25) {
        const userName = Cypress._.uniqueId(Date.now().toString());

        cy.createUser({ username: userName }).then((resp: Cypress.Response<any>) => {
          const userId = resp.body.id;

          userIdsList.push(userId);
        });

        i++;
      }

      // create one more for sorting test
      cy.createUser({ username: uniqueUserName }, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
        const userId = resp.body.id;

        uniqueUserName = resp.body.username;
        userIdsList.push(userId);
      });
    });

    it('pagination is visible and user is able to navigate through users data', () => {
      usersPo.goTo(); // This is needed for the @vai only world
      usersPo.waitForPage();
      const count = initialCount + 26;

      // check users count
      cy.waitForRancherResources('v3', 'users', count).then((resp: Cypress.Response<any>) => {
        const count = resp.body.data.length;

        // pagination is visible
        usersPo.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        usersPo.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        usersPo.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Users`);
          });

        // navigate to next page - right button
        usersPo.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        usersPo.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } Users`);
          });
        usersPo.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        usersPo.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        usersPo.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Users`);
          });
        usersPo.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        usersPo.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        usersPo.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } Users`);
          });

        // navigate to first page - beginning button
        usersPo.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        usersPo.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Users`);
          });
        usersPo.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        usersPo.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('filter users', () => {
      UsersPo.navTo();
      usersPo.waitForPage();

      usersPo.list().resourceTable().sortableTable().checkVisible();
      usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

      // filter by id
      usersPo.list().resourceTable().sortableTable().filter(userIdsList[0]);
      usersPo.list().resourceTable().sortableTable().checkRowCount(false, 1);
      usersPo.list().resourceTable().sortableTable().rowElementWithName(userIdsList[0])
        .should('be.visible');

      // filter by name
      usersPo.list().resourceTable().sortableTable().filter(uniqueUserName);
      usersPo.list().resourceTable().sortableTable().checkRowCount(false, 1);
      usersPo.list().resourceTable().sortableTable().rowElementWithName(uniqueUserName)
        .should('be.visible');

      usersPo.list().resourceTable().sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated users data', () => {
      UsersPo.navTo();
      usersPo.waitForPage();

      // check table is sorted by name in ASC order by default
      usersPo.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(3, 'down');

      // user name should be visible on first page (sorted in ASC order)
      usersPo.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      usersPo.list().resourceTable().sortableTable().rowElementWithName(uniqueUserName)
        .scrollIntoView()
        .should('be.visible');

      // navigate to last page
      usersPo.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // user name should NOT be visible on last page (sorted in ASC order)
      usersPo.list().resourceTable().sortableTable().rowElementWithName(uniqueUserName)
        .should('not.exist');

      // sort by name in DESC order
      usersPo.list().resourceTable().sortableTable().sort(3)
        .click();
      usersPo.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(3, 'up');

      // user name should be NOT visible on first page (sorted in DESC order)
      usersPo.list().resourceTable().sortableTable().rowElementWithName(uniqueUserName)
        .should('not.exist');

      // navigate to last page
      usersPo.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // user name should be visible on last page (sorted in DESC order)
      usersPo.list().resourceTable().sortableTable().rowElementWithName(uniqueUserName)
        .scrollIntoView()
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      generateUsersDataSmall();
      usersPo.goTo(); // this is needed here for the intercept to work
      UsersPo.navTo();
      usersPo.waitForPage();
      cy.wait('@usersDataSmall');

      usersPo.list().resourceTable().sortableTable().checkVisible();
      usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      usersPo.list().resourceTable().sortableTable().checkRowCount(false, 2);
      usersPo.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after(() => {
      userIdsList.forEach((r) => cy.deleteRancherResource('v3', 'Users', r, false));
      // Ensure the default rows per page value is set after executing the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, 'local', 'none', '{"local":["all://user"]}');
    });
  });
});
