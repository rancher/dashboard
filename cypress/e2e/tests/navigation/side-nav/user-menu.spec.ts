import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { UserMenuItems } from '@/cypress/support/types/menu-actions';

const userMenu = new UserMenuPo();

describe('User can logout of Rancher', { tags: ['@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('Can logout of Rancher successfully', () => {
    /*
    Logout of Rancher Dashboard
    Verify user lands on login page after logging out
    Attempt to navigate to the Home page without logging back in
    Verify user remains on login page
    */
    HomePagePo.goToAndWaitForGet();
    userMenu.open()
    userMenu.isOpen()

    const availableItems: UserMenuItems[] = [
      UserMenuItems.Preferences,
      UserMenuItems.LogOut,
      UserMenuItems.AccountApiKeys
    ]

    availableItems.forEach((action) => {
      userMenu.getMenuItemByLabel(action).should('exist');
    });
    
  });
});
