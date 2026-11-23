import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';
import { GrowlManagerPo } from '@/cypress/e2e/po/components/growl-manager.po';

const usersPo = new UsersPo('_');
const userMenu = new UserMenuPo();
const growl = new GrowlManagerPo();
const createdTargetIds: string[] = [];
const activeSession = {
  userId:        'u-e2e-impersonated',
  displayName:   'E2E Impersonated User',
  principalId:   'local://u-e2e-impersonated',
  impersonating: true,
};
const statusRequestTimeout = 120000;

const uniqueUser = () => `e2e-impersonation-${ Cypress._.uniqueId(Date.now().toString()) }`;

describe('User impersonation lifecycle', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  afterEach(() => {
    cy.login();
    cy.then(() => {
      const targetIds = createdTargetIds.splice(0);

      targetIds.forEach((targetId) => {
        cy.deleteRancherResource('v1', 'management.cattle.io.users', targetId, false);
      });
    });
  });

  function stubStatus(active: boolean) {
    cy.intercept('GET', '/v3/impersonation-sessions/current', {
      statusCode: active ? 200 : 404,
      body:       active ? activeSession : {},
    }).as('impersonationStatus');
  }

  function openUsersPage() {
    UsersPo.navTo();
    usersPo.waitForRequests();
  }

  function visitHomeWithStatus(statusCode: number) {
    cy.visit('/home');
    cy.wait('@impersonationStatus', { requestTimeout: statusRequestTimeout })
      .its('response.statusCode')
      .should('eq', statusCode);
  }

  function waitForNewStatus(previousRequestCount: number, statusCode: number) {
    cy.get('@impersonationStatus.all', { timeout: statusRequestTimeout }).should((requests: any[]) => {
      const newRequests = requests.slice(previousRequestCount);
      const latestRequest = newRequests[newRequests.length - 1];

      expect(newRequests).not.to.be.empty;
      expect(latestRequest?.response?.statusCode).to.eq(statusCode);
    });
  }

  function createTarget() {
    const username = uniqueUser();

    return cy.createUser({
      username,
      globalRole: { role: 'user' },
    }).then((response: Cypress.Response<any>) => ({
      id:       response.body.id as string,
      username: response.body.username as string,
    })).then((target) => {
      createdTargetIds.push(target.id);

      return target;
    });
  }

  function openTargetRowActionMenu(username: string) {
    usersPo.list().rowWithName(username, false, { timeout: statusRequestTimeout }).actionBtn().click();
  }

  function openTargetActionMenu(username: string) {
    openTargetRowActionMenu(username);

    return cy.contains('Login as this user')
      .should('be.visible');
  }

  it('starts impersonation and renders the active Header state', () => {
    let active = false;

    cy.intercept('GET', '/v3/impersonation-sessions/current', (request) => {
      request.reply({
        statusCode: active ? 200 : 404,
        body:       active ? activeSession : {},
      });
    }).as('impersonationStatus');

    visitHomeWithStatus(404);
    createTarget().then((target) => {
      openUsersPage();
      cy.intercept('POST', `**/*/${ target.id }*action=impersonate*`, (request) => {
        active = true;
        request.reply({ statusCode: 200, body: activeSession });
      }).as('startImpersonation');
      let previousStatusRequestCount = 0;

      cy.get('@impersonationStatus.all').then((requests: any[]) => {
        previousStatusRequestCount = requests.length;
      });
      openTargetActionMenu(target.username).click();
      cy.wait('@startImpersonation').its('response.statusCode').should('eq', 200);
      waitForNewStatus(previousStatusRequestCount, 200);
      cy.getId('impersonation-header-badge').should('be.visible').and('contain', activeSession.displayName);

      userMenu.open();
      cy.getId('user-menu-stop-impersonation').should('be.visible');
      cy.getId('nav_header_showUserMenu').click();
      openTargetRowActionMenu(target.username);
      cy.contains('Login as this user')
        .should('not.exist');
    });
  });

  it('does not enter an active state after a failed start', () => {
    stubStatus(false);
    visitHomeWithStatus(404);

    createTarget().then((target) => {
      openUsersPage();
      cy.intercept('POST', `**/*/${ target.id }*action=impersonate*`, {
        statusCode: 403,
        body:       { message: 'impersonation denied' },
      }).as('failedImpersonation');

      openTargetActionMenu(target.username).click();
      cy.wait('@failedImpersonation').its('response.statusCode').should('eq', 403);
      cy.getId('impersonation-header-badge').should('not.exist');
      growl.growlMessage().should('be.visible');
      cy.location('pathname').should('contain', '/auth/management.cattle.io.user');
    });
  });

  it('does not show a badge while status is pending', () => {
    let completeStatusRequest = () => {};
    let statusRequestStarted = false;

    cy.intercept('GET', '/v3/impersonation-sessions/current', (request) => {
      statusRequestStarted = true;

      return new Cypress.Promise<void>((resolve) => {
        completeStatusRequest = () => {
          request.reply({
            statusCode: 200,
            body:       activeSession,
          });
          resolve();
        };
      });
    }).as('pendingImpersonationStatus');

    cy.visit('/home');
    cy.wrap(null).should(() => {
      expect(statusRequestStarted).to.be.true;
    });
    cy.getId('impersonation-header-badge').should('not.exist');
    cy.then(() => completeStatusRequest());
    cy.wait('@pendingImpersonationStatus', { requestTimeout: statusRequestTimeout })
      .its('response.statusCode')
      .should('eq', 200);
    cy.getId('impersonation-header-badge').should('be.visible');
  });

  it('keeps a 404 status response as a normal session', () => {
    stubStatus(false);

    visitHomeWithStatus(404);
    cy.getId('impersonation-header-badge').should('not.exist');
    userMenu.open();
    cy.getId('user-menu-stop-impersonation').should('not.exist');
  });

  it('does not treat an unexpected status error as an inactive session', () => {
    cy.intercept('GET', '/v3/impersonation-sessions/current', {
      statusCode: 500,
      body:       { message: 'status unavailable' },
    }).as('unexpectedImpersonationStatus');

    cy.visit('/home');
    cy.wait('@unexpectedImpersonationStatus', { requestTimeout: statusRequestTimeout })
      .its('response.statusCode')
      .should('eq', 500);
    cy.getId('impersonation-header-badge').should('not.exist');
  });

  it('sends only one return request while the DELETE is pending', () => {
    stubStatus(true);
    visitHomeWithStatus(200);

    openUsersPage();
    userMenu.open();
    let stopRequestCount = 0;
    let previousStatusRequestCount = 0;

    cy.intercept('DELETE', '/v3/impersonation-sessions/current', (request) => {
      stopRequestCount++;
      request.reply({
        delay:      15000,
        statusCode: 200,
        body:       { impersonating: false },
      });
    }).as('pendingStopImpersonation');

    cy.get('@impersonationStatus.all').then((requests: any[]) => {
      previousStatusRequestCount = requests.length;
    });
    cy.getId('user-menu-stop-impersonation').click();
    cy.wrap(null).should(() => {
      expect(stopRequestCount).to.eq(1);
    });
    userMenu.ensureOpen();
    cy.getId('user-menu-stop-impersonation').click();
    cy.wrap(null).should(() => {
      expect(stopRequestCount).to.eq(1);
    });
    cy.wait('@pendingStopImpersonation', { responseTimeout: statusRequestTimeout })
      .its('response.statusCode')
      .should('eq', 200);
    waitForNewStatus(previousStatusRequestCount, 200);
    cy.get('@pendingStopImpersonation.all').should('have.length', 1);
  });

  it('keeps the return control available after a failed return and allows retry', () => {
    stubStatus(true);
    visitHomeWithStatus(200);

    openUsersPage();
    cy.getId('impersonation-header-badge').should('be.visible');
    userMenu.open();

    cy.intercept('DELETE', '/v3/impersonation-sessions/current', {
      statusCode: 500,
      body:       { message: 'return failed' },
    }).as('failedReturn');

    cy.getId('user-menu-stop-impersonation').click();
    cy.wait('@failedReturn');
    userMenu.ensureOpen();
    cy.getId('user-menu-stop-impersonation').should('be.visible').click();
    cy.wait('@failedReturn');
    cy.getId('impersonation-header-badge').should('be.visible');
    cy.get('@failedReturn.all').should('have.length', 2);
  });

  it('returns successfully with one DELETE and clears the active UI after reload', () => {
    let active = true;

    cy.intercept('GET', '/v3/impersonation-sessions/current', (request) => {
      request.reply({
        statusCode: active ? 200 : 404,
        body:       active ? activeSession : {},
      });
    }).as('impersonationStatus');

    visitHomeWithStatus(200);
    openUsersPage();
    cy.getId('impersonation-header-badge').should('be.visible');
    userMenu.open();

    cy.intercept('DELETE', '/v3/impersonation-sessions/current', (request) => {
      active = false;
      request.reply({ statusCode: 200, body: { impersonating: false } });
    }).as('stopImpersonation');
    let previousStatusRequestCount = 0;

    cy.get('@impersonationStatus.all').then((requests: any[]) => {
      previousStatusRequestCount = requests.length;
    });
    cy.getId('user-menu-stop-impersonation').click();
    cy.wait('@stopImpersonation').its('response.statusCode').should('eq', 200);
    waitForNewStatus(previousStatusRequestCount, 404);
    cy.get('@stopImpersonation.all').should('have.length', 1);
    cy.getId('impersonation-header-badge').should('not.exist');
    cy.getId('user-menu-stop-impersonation').should('not.exist');
  });
});
