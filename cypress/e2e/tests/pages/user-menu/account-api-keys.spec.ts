import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { generateTokensDataSmall } from '@/cypress/e2e/blueprints/account-and-apikeys/tokens-get';

const userMenu = new UserMenuPo();
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const apiKeysList = accountPage.list();
const tokenIdsList = [];

// TODO: undo skipping when this issue is resolved: https://github.com/rancher/dashboard/issues/12325
describe.skip('Account and API Keys', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
  });

  describe('User can make changes to their account', { tags: ['@userMenu', '@adminUser', '@standardUser'] }, () => {
    it('Can navigate to Account and API Keys page and change their password', () => {
    /**
     * Open user menu and navigate to Account and API Keys page
     * Verify url includes endpoint '/account'
     * Verify page title
     * Verify user can change their password and change it back
     */
      const homePage = new HomePagePo();

      HomePagePo.goTo();
      homePage.waitForPage();
      userMenu.clickMenuItem('Account & API Keys');
      accountPage.waitForPage();
      accountPage.checkIsCurrentPage();
      accountPage.title();

      accountPage.changePassword();
      accountPage.currentPassword().set(Cypress.env('password'));
      accountPage.newPassword().set('NewPassword11!!');
      accountPage.confirmPassword().set('NewPassword11!!');
      cy.intercept('POST', '/v3/users?action=changepassword').as('changePw');
      accountPage.apply();
      cy.wait('@changePw').its('response.statusCode').should('eq', 200);

      accountPage.changePassword();
      accountPage.currentPassword().set('NewPassword11!!');
      accountPage.newPassword().set(Cypress.env('password'));
      accountPage.confirmPassword().set(Cypress.env('password'));
      accountPage.apply();
      cy.wait('@changePw').its('response.statusCode').should('eq', 200);
    });

    it('Can create and delete API keys', () => {
    /**
     * Bulk delete existing API keys (to make this a deterministic test)
     * Verify empty state message displays
     * Verify user can create API key and verify number of rows on table is 1
     * Grab access key after creation and validate API key details
     * Verify user can delete API key and verify empty state message displays
     */
      const keyDesc = `keyDescription${ Date.now() }`;

      accountPage.goTo();
      accountPage.create();
      createKeyPage.waitForPage();
      createKeyPage.isCurrentPage();
      createKeyPage.create();
      createKeyPage.done();

      apiKeysList.resourceTable().sortableTable().selectAllCheckbox().set();
      apiKeysList.resourceTable().sortableTable().deleteButton().click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      apiKeysList.resourceTable().sortableTable().checkRowCount(true, 1);

      accountPage.create();
      createKeyPage.waitForPage();
      createKeyPage.isCurrentPage();
      createKeyPage.title();
      createKeyPage.description().set(keyDesc);
      createKeyPage.create();

      const accessKey: string[] = [];

      createKeyPage.apiAccessKey().invoke('text').then((el) => {
        accessKey.push(el);

        createKeyPage.done();
        apiKeysList.checkVisible();
        apiKeysList.resourceTable().sortableTable().checkRowCount(false, 1);
        apiKeysList.details(accessKey[0], 2).should('include.text', accessKey[0]);
        apiKeysList.details(accessKey[0], 3).should('include.text', keyDesc);
        apiKeysList.actionMenu(accessKey[0]).getMenuItem('Delete').click();
      });

      cy.intercept('DELETE', '/v3/tokens/*').as('deleteApiKey');
      promptRemove.remove();
      cy.wait('@deleteApiKey').its('response.statusCode').should('eq', 204);

      apiKeysList.resourceTable().sortableTable().checkRowCount(true, 1);
    });
  });

  describe('List', { tags: ['@vai', '@userMenu', '@adminUser'] }, () => {
    const tokenDesc = 'e2e-test-description';
    const uniqueTokenDesc = 'aaa-e2e-test-description';
    let initialCount: number;

    before('set up', () => {
      cy.getRancherResource('v3', 'tokens').then((resp: Cypress.Response<any>) => {
        initialCount = resp.body.data.length - 1;
      });
      // create tokens
      let i = 0;

      while (i < 25) {
        cy.createToken(tokenDesc, 3600000, false).then((resp: Cypress.Response<any>) => {
          const tokenId = resp.body.id;

          tokenIdsList.push(tokenId);
        });

        i++;
      }

      // create one more for sorting test
      cy.createToken(uniqueTokenDesc, 3600000, false, 'local').then((resp: Cypress.Response<any>) => {
        const tokenId = resp.body.id;

        tokenIdsList.push(tokenId);
      });
      cy.tableRowsPerPageAndNamespaceFilter(10, 'local', 'none', '{\"local\":[]}');
    });

    it('pagination is visible and user is able to navigate through tokens data', () => {
      // check tokens count
      const count = initialCount + 26;

      cy.waitForRancherResources('v3', 'tokens', count).then((resp: Cypress.Response<any>) => {
        const count = resp.body.data.length - 1;

        HomePagePo.goTo();

        AccountPagePo.navTo();
        accountPage.waitForPage();

        // pagination is visible
        accountPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        accountPage.sortableTable().pagination().beginningButton().isDisabled();
        accountPage.sortableTable().pagination().leftButton().isDisabled();
        accountPage.sortableTable().pagination().rightButton().isEnabled();
        accountPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        accountPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } API Keys`);
        });

        // navigate to next page - right button
        accountPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        accountPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`11 - 20 of ${ count } API Keys`);
        });
        accountPage.sortableTable().pagination().beginningButton().isEnabled();
        accountPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        accountPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        accountPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } API Keys`);
        });
        accountPage.sortableTable().pagination().beginningButton().isDisabled();
        accountPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        accountPage.sortableTable().pagination().endButton().scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        accountPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } API Keys`);
        });

        // navigate to first page - beginning button
        accountPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        accountPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } API Keys`);
        });
        accountPage.sortableTable().pagination().beginningButton().isDisabled();
        accountPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('filter tokens', () => {
      AccountPagePo.navTo();
      accountPage.waitForPage();

      accountPage.sortableTable().checkVisible();
      accountPage.sortableTable().checkLoadingIndicatorNotVisible();
      accountPage.sortableTable().checkRowCount(false, 10);

      // filter by access key (id)
      accountPage.sortableTable().filter(tokenIdsList[0]);
      accountPage.sortableTable().checkRowCount(false, 1);
      accountPage.sortableTable().rowElementWithName(tokenIdsList[0]).scrollIntoView().should('be.visible');

      // filter by description
      accountPage.sortableTable().filter(uniqueTokenDesc);
      accountPage.sortableTable().checkRowCount(false, 1);
      accountPage.sortableTable().rowElementWithName(uniqueTokenDesc).scrollIntoView().should('be.visible');

      accountPage.sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated tokens data', () => {
      AccountPagePo.navTo();
      accountPage.waitForPage();

      // check table is sorted by access key in ASC order by default
      accountPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // sort by description in ASC order
      accountPage.sortableTable().sort(3).click();
      accountPage.sortableTable().tableHeaderRow().checkSortOrder(3, 'down');

      // token description should be visible on first page (sorted in ASC order)
      accountPage.sortableTable().rowElementWithName(uniqueTokenDesc).scrollIntoView().should('be.visible');

      // navigate to last page
      accountPage.sortableTable().pagination().endButton().scrollIntoView()
        .click();

      // token description should be NOT visible on last page (sorted in ASC order)
      accountPage.sortableTable().rowElementWithName(uniqueTokenDesc).should('not.exist');

      // sort by description in DESC order
      accountPage.sortableTable().sort(3).click();
      accountPage.sortableTable().tableHeaderRow().checkSortOrder(3, 'up');

      // token description should be NOT visible on first page (sorted in DESC order)
      accountPage.sortableTable().rowElementWithName(uniqueTokenDesc).should('not.exist');

      // navigate to last page
      accountPage.sortableTable().pagination().endButton().scrollIntoView()
        .click();

      // token description should be visible on last page (sorted in DESC order)
      accountPage.sortableTable().rowElementWithName(uniqueTokenDesc).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      generateTokensDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      AccountPagePo.navTo();
      accountPage.waitForPage();
      cy.wait('@tokensDataSmall');

      accountPage.sortableTable().checkVisible();
      accountPage.sortableTable().checkLoadingIndicatorNotVisible();
      accountPage.sortableTable().checkRowCount(false, 3);
      accountPage.sortableTable().pagination().checkNotExists();
    });

    after(() => {
      tokenIdsList.forEach((r) => cy.deleteRancherResource('v3', 'tokens', r, false));
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, 'local', 'none', '{"local":["all://user"]}');
    });
  });
});
