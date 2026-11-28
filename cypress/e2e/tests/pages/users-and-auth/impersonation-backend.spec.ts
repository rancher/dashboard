import UsersPo from '@/cypress/e2e/po/pages/users-and-auth/users.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

const usersPo = new UsersPo('_');
const userMenu = new UserMenuPo();
const requestTimeout = 120000;
const sessionCookie = 'R_SESS';
const originalSessionCookie = 'R_IMPERSONATOR_SESS';

interface ImpersonationSession {
  userId: string;
  displayName: string;
  principalId: string;
  impersonating: boolean;
}

const uniqueUser = () => `e2e-impersonation-backend-${ Cypress._.uniqueId(Date.now().toString()) }`;

describe('User impersonation real backend lifecycle', { tags: ['@usersAndAuths', '@adminUser'] }, () => {
  let createdTargetId = '';
  let sessionMayBeActive = false;

  beforeEach(() => {
    createdTargetId = '';
    sessionMayBeActive = false;
    cy.login();
    cy.visit('/home');
    cy.get('[data-testid="nav_header_showUserMenu"]', { timeout: requestTimeout }).should('be.visible');
  });

  afterEach(() => {
    if (sessionMayBeActive) {
      cy.getCookie('CSRF').then((csrf) => {
        if (!csrf) {
          return;
        }

        cy.request({
          method:           'DELETE',
          url:              `${ Cypress.env('api') }/v3/impersonation-sessions/current`,
          headers:          { 'x-api-csrf': csrf.value },
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 200 || response.status === 404) {
            sessionMayBeActive = false;
          }
        });
      });
    }

    cy.login();
    cy.then(() => {
      if (createdTargetId) {
        cy.deleteRancherResource('v1', 'management.cattle.io.users', createdTargetId, false);
      }
    });
  });

  it('uses real start, status, recovery guard, and stop responses', () => {
    let originalSessionValue = '';
    const username = uniqueUser();

    cy.getCookie(sessionCookie).should('exist').then((cookie) => {
      originalSessionValue = cookie?.value || '';
      expect(originalSessionValue).not.to.eq('');
    });

    cy.createUser({
      username,
      globalRole: { role: 'user' },
      password:   `${ Cypress.env('password') }-impersonation-backend-e2e`,
    }).then((response: Cypress.Response<any>) => {
      createdTargetId = response.body.id;
      const targetUsername = response.body.username;

      UsersPo.navTo();
      usersPo.waitForRequests();
      usersPo.list().rowWithName(targetUsername, false, { timeout: requestTimeout }).actionBtn().click();
      cy.contains('Login as this user').should('be.visible').click();
      sessionMayBeActive = true;

      cy.get('[data-testid="impersonation-header-badge"]', { timeout: requestTimeout })
        .should('be.visible')
        .and('contain', createdTargetId);

      cy.getCookie(originalSessionCookie).should((cookie) => {
        expect(cookie?.value).to.eq(originalSessionValue);
        expect(cookie?.secure).to.eq(true);
      });
      cy.getCookie(sessionCookie).should((cookie) => {
        expect(cookie?.value).not.to.eq(originalSessionValue);
        expect(cookie?.secure).to.eq(true);
      });

      cy.request<ImpersonationSession>({
        method: 'GET',
        url:    `${ Cypress.env('api') }/v3/impersonation-sessions/current`,
      }).then((statusResponse) => {
        expect(statusResponse.status).to.eq(200);
        expect(statusResponse.body).to.include({
          userId:        createdTargetId,
          impersonating: true,
        });
        expect(statusResponse.body.principalId).not.to.eq('');
      });

      cy.getCookie('CSRF').should('exist').then((csrf) => {
        cy.request({
          method:           'POST',
          url:              `${ Cypress.env('api') }/v3/impersonation-sessions/recover`,
          headers:          { 'x-api-csrf': csrf?.value },
          failOnStatusCode: false,
        }).then((recoveryResponse) => {
          expect(recoveryResponse.status).to.eq(409);
        });
      });

      cy.getId('impersonation-header-badge').should('be.visible');
      userMenu.open();
      cy.getId('user-menu-stop-impersonation').should('be.visible').click();

      cy.get('[data-testid="impersonation-header-badge"]', { timeout: requestTimeout }).should('not.exist');
      cy.request({
        method:           'GET',
        url:              `${ Cypress.env('api') }/v3/impersonation-sessions/current`,
        failOnStatusCode: false,
      }).then((statusResponse) => {
        expect(statusResponse.status).to.eq(404);
      });
      cy.getCookie(sessionCookie).should((cookie) => {
        expect(cookie?.value).to.eq(originalSessionValue);
      });
      cy.getCookie(originalSessionCookie).should('not.exist');
      sessionMayBeActive = false;
    });
  });
});
