import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { LoginPagePo } from '~/cypress/e2e/po/pages/login-page.po';
import UsersAndAuthPo from '~/cypress/e2e/po/pages/users-and-auth/users-and-auth.po';

const userMenu = new UserMenuPo();
const loginPage = new LoginPagePo();

const customRoleName = 'my-custom-role';
const standardUsername = 'standard-user';
const standardPassword = 'standard-password';

describe('Users and Authentication', () => {
  it('Standard user with List, Get & Resources: Global Roles should be able to list users in Users and Auth', () => {
    const userRoles = new UsersAndAuthPo('/c/_/auth/roles');
    const usersAdmin = new UsersAndAuthPo('/c/_/auth/management.cattle.io.user');

    // this will login as admin
    cy.login();

    // create global role
    userRoles.goTo();
    userRoles.listCreate();

    userRoles.name().set(customRoleName);
    userRoles.selectVerbs(3);
    userRoles.selectVerbs(4);
    userRoles.selectResourcesByLabelValue('GlobalRoles');
    userRoles.saveCreateForm().click();

    // create standard user
    usersAdmin.goTo();
    usersAdmin.listCreate();

    usersAdmin.username().set(standardUsername);
    usersAdmin.newPass().set(standardPassword);
    usersAdmin.confirmNewPass().set(standardPassword);
    usersAdmin.selectCheckbox(customRoleName).set();
    usersAdmin.saveCreateForm().click();

    // need to give some time out, otherwise we won't be able to login the new user successfully
    // it has something to do with the user creation process
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);

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
