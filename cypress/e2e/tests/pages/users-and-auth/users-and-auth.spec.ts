import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { LoginPagePo } from '~/cypress/e2e/po/pages/login-page.po';
import UsersAndAuthPo from '~/cypress/e2e/po/pages/users-and-auth/users-and-auth.po';

const userMenu = new UserMenuPo();
const loginPage = new LoginPagePo();

const runTimestamp = +new Date();
const runPrefix = `e2e-test-${ runTimestamp }`;

const customRoleName = `${ runPrefix }-my-custom-role`;
const standardUsername = `${ runPrefix }-standard-user`;
const standardPassword = 'standard-password';

describe('Users and Authentication', () => {
  it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
    const userRoles = new UsersAndAuthPo('_', 'roles');
    const usersAdmin = new UsersAndAuthPo('_', 'management.cattle.io.user');

    // last API call on the user creation process (with global role assignment)
    cy.intercept('GET', '/v1/management.cattle.io.globalrolebindings').as('globalRoleBindingCreated');

    // this will login as admin
    cy.login();

    // create global role
    userRoles.goTo();
    userRoles.listCreate();

    userRoles.name().set(customRoleName);
    userRoles.selectVerbs(0, 3);
    userRoles.selectVerbs(0, 4);
    userRoles.selectResourcesByLabelValue(0, 'GlobalRoles');
    userRoles.saveCreateForm().click();

    // create standard user
    usersAdmin.goTo();
    usersAdmin.listCreate();

    usersAdmin.username().set(standardUsername);
    usersAdmin.newPass().set(standardPassword);
    usersAdmin.confirmNewPass().set(standardPassword);
    usersAdmin.selectCheckbox(customRoleName).set();
    usersAdmin.saveCreateForm().click();

    // we need to wait for that last API call to be finished to make sure we are ready for login
    // with that new user
    cy.wait('@globalRoleBindingCreated').then((res) => {
      expect(res.response?.statusCode).to.equal(200);

      // let's just check that the user is on the list view before attempting to login
      usersAdmin.goTo();
      usersAdmin.waitForPage();
      usersAdmin.listElementWithName(standardUsername).should('exist');

      // logout admin
      userMenu.toggle();
      userMenu.isOpen();
      userMenu.clickMenuItem('Log Out');
      loginPage.waitForPage();
      loginPage.username().checkVisible();

      // login as standard user
      cy.login(standardUsername, standardPassword);

      // navigate to the roles page and make sure user can see it
      userRoles.goTo();
      userRoles.listTitle().should('contain', 'Roles');
      userRoles.listElements().should('have.length.of.at.least', 1);

      // navigate to the users page and make sure user can see it
      usersAdmin.goTo();
      usersAdmin.listTitle().should('contain', 'Users');
      usersAdmin.listElements().should('have.length.of.at.least', 1);
    });
  });
});
