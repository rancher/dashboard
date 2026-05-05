import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

const LAST_LOGIN_COLUMN = 6;
const NAME_COLUMN = 3;

describe('Users: Last Login sorting', { testIsolation: 'off', tags: ['@usersAndAuths', '@adminUser'] }, () => {
  const runTimestamp = +new Date();
  const usersPo = new UsersPo();
  const userIdsList: string[] = [];
  let userNullName: string;
  let userActiveName: string;

  before(() => {
    cy.login();

    cy.createUser({
      username:   `llsort-null-${ runTimestamp }`,
      globalRole: { role: 'user' },
    }).then((resp: Cypress.Response<any>) => {
      userNullName = resp.body.username;
      userIdsList.push(resp.body.id);
    });

    cy.createUser({
      username:   `llsort-active-${ runTimestamp }`,
      globalRole: { role: 'user' },
    }).then((resp: Cypress.Response<any>) => {
      userActiveName = resp.body.username;
      userIdsList.push(resp.body.id);
    });
  });

  beforeEach(() => {
    cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('getUsers');
  });

  it('populate Last Login for the active test user', () => {
    // Log in once as the active user so its `cattle.io/last-login` label is populated.
    cy.clearAllSessions();
    cy.login(userActiveName, Cypress.env('password'), false);
  });

  it('should place users with a null Last Login at the bottom in descending order and at the top in ascending order', () => {
    cy.clearAllSessions();
    cy.login();

    usersPo.goTo();
    usersPo.waitForPage();
    cy.wait('@getUsers');

    usersPo.list().resourceTable().sortableTable().checkVisible();
    usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    // Narrow the table to the two test users created in this run so ordering is deterministic
    // even if previous failed runs left orphan users behind.
    usersPo.list().resourceTable().sortableTable().filter(`-${ runTimestamp }`);
    usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    usersPo.list().resourceTable().sortableTable().checkRowCount(false, 2);

    // First click selects the column for sorting in ASC order (icon points down).
    // Null Last Login should bubble to the top, populated value to the bottom.
    usersPo.list().resourceTable().sortableTable().sort(LAST_LOGIN_COLUMN)
      .click();
    usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    usersPo.list().resourceTable().sortableTable().tableHeaderRow()
      .checkSortOrder(LAST_LOGIN_COLUMN, 'down');

    usersPo.list().resourceTable().sortableTable().row(0)
      .column(NAME_COLUMN)
      .should('contain', userNullName);
    usersPo.list().resourceTable().sortableTable().row(1)
      .column(NAME_COLUMN)
      .should('contain', userActiveName);

    // Second click flips to DESC order (icon points up).
    // Populated Last Login should be on top, null user at the bottom.
    usersPo.list().resourceTable().sortableTable().sort(LAST_LOGIN_COLUMN)
      .click();
    usersPo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    usersPo.list().resourceTable().sortableTable().tableHeaderRow()
      .checkSortOrder(LAST_LOGIN_COLUMN, 'up');

    usersPo.list().resourceTable().sortableTable().row(0)
      .column(NAME_COLUMN)
      .should('contain', userActiveName);
    usersPo.list().resourceTable().sortableTable().row(1)
      .column(NAME_COLUMN)
      .should('contain', userNullName);
  });

  after(() => {
    cy.deleteManyResources({
      toDelete: userIdsList,
      deleteFn: (r) => cy.deleteRancherResource('v1', 'management.cattle.io.users', r, false)
    });
  });
});
