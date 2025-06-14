import OidcClientsPagePo from '@/cypress/e2e/po/pages/users-and-auth/oidc-client.po';
import OidcClientsCreateEditPo from '@/cypress/e2e/po/edit/oidc-clients.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { promptModal } from '@/cypress/e2e/po/prompts/shared/modalInstances.po';

describe('Rancher as an OIDC Provider', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {
  const OIDC_CREATE_DATA = {
    APP_NAME: 'some-app-name',
    APP_DESC: 'some-app-desc',
    CB_URLS:  [
      'https://some-dummy-url-1.com',
      'https://some-dummy-url-2.com'
    ],
    REF_TOKEN_EXP: 3800,
    TOKEN_EXP:     800
  };

  const OIDC_EDIT_DATA = {
    APP_NAME: 'some-app-name',
    APP_DESC: 'some-app-desc1',
    CB_URLS:  [
      'https://some-dummy-url-11.com',
      'https://some-dummy-url-21.com'
    ],
    REF_TOKEN_EXP: 3801,
    TOKEN_EXP:     801
  };

  const oidcClientsPage = new OidcClientsPagePo();
  const oidcClientsCreatePage = new OidcClientsCreateEditPo();
  const oidcClientsEditPage = new OidcClientsCreateEditPo('local', OIDC_CREATE_DATA.APP_NAME, true);
  const oidcClientsDetailPage = new OidcClientsCreateEditPo('local', OIDC_CREATE_DATA.APP_NAME);

  before(() => {
    cy.login();
  });

  it('should be able to create an OIDC client application', () => {
    cy.intercept('POST', `/v1/management.cattle.io.oidcclients`).as('createRequest');

    oidcClientsPage.goTo('local');
    oidcClientsPage.waitForPage();

    // check title and list view
    oidcClientsPage.title().should('be.visible');
    oidcClientsPage.list().resourceTable().sortableTable().checkVisible();
    oidcClientsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    // should be able to copy OIDC urls on list view
    oidcClientsPage.list().issuerURL().copyToClipboard();
    oidcClientsPage.list().discoveryDocument().copyToClipboard();
    oidcClientsPage.list().jwksURI().copyToClipboard();

    // let's create an oidc client
    oidcClientsPage.createOidcClient();
    oidcClientsCreatePage.waitForPage();

    oidcClientsCreatePage.applicationName().set(OIDC_CREATE_DATA.APP_NAME);
    oidcClientsCreatePage.applicationDescription().set(OIDC_CREATE_DATA.APP_DESC);
    oidcClientsCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[0], 0, 'Add Callback URL');
    oidcClientsCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[1], 1, 'Add Callback URL');
    oidcClientsCreatePage.refreshTokenExpiration().setValue(OIDC_CREATE_DATA.REF_TOKEN_EXP);
    oidcClientsCreatePage.tokenExpiration().setValue(OIDC_CREATE_DATA.TOKEN_EXP);

    oidcClientsCreatePage.saveCreateForm().createEditView().create();

    // check data from network request
    cy.wait('@createRequest').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
      expect(response?.body.spec.description).to.equal(OIDC_CREATE_DATA.APP_DESC);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_CREATE_DATA.CB_URLS[0]);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_CREATE_DATA.CB_URLS[1]);
      expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_CREATE_DATA.REF_TOKEN_EXP);
      expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_CREATE_DATA.TOKEN_EXP);
    });

    oidcClientsDetailPage.checkCopyClientIDExists();
    oidcClientsDetailPage.checkClientFullSecretCopyExists(0);

    oidcClientsDetailPage.clientID().copyToClipboard();
    oidcClientsDetailPage.clientFullSecretCopy(0).copyToClipboard();
  });

  it('should be able to edit an OIDC client application', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('editRequest');

    OidcClientsPagePo.goTo('local');
    oidcClientsPage.waitForPage();
    oidcClientsPage.list().actionMenu(OIDC_CREATE_DATA.APP_NAME).getMenuItem('Edit Config').scrollIntoView()
      .click();

    oidcClientsEditPage.applicationDescription().set(OIDC_EDIT_DATA.APP_DESC);
    oidcClientsEditPage.callbackUrls().clearListItem(0);
    oidcClientsEditPage.callbackUrls().clearListItem(1);
    oidcClientsEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[0], 0, 'Add Callback URL', undefined, false);
    oidcClientsEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[1], 1, 'Add Callback URL', undefined, false);
    oidcClientsEditPage.refreshTokenExpiration().setValue(OIDC_EDIT_DATA.REF_TOKEN_EXP);
    oidcClientsEditPage.tokenExpiration().setValue(OIDC_EDIT_DATA.TOKEN_EXP);

    oidcClientsEditPage.saveCreateForm().createEditView().save();

    // check data from network request
    cy.wait('@editRequest').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
      expect(response?.body.spec.description).to.equal(OIDC_EDIT_DATA.APP_DESC);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_EDIT_DATA.CB_URLS[0]);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_EDIT_DATA.CB_URLS[1]);
      expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.REF_TOKEN_EXP);
      expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.TOKEN_EXP);
    });
  });

  it('should be able to add a new secret for an OIDC provider', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('addNewSecret');

    oidcClientsDetailPage.goTo();
    oidcClientsDetailPage.waitForPage();

    oidcClientsDetailPage.addNewSecretBtnClick();

    // check data from network request
    cy.wait('@addNewSecret').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.metadata.annotations['cattle.io/oidc-client-secret-create']).to.equal('true');
    });

    oidcClientsDetailPage.checkClientFullSecretCopyExists(1);
    oidcClientsDetailPage.clientFullSecretCopy(1).copyToClipboard();
  });

  it('should be able to regenerate a secret for an OIDC provider', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('regenSecret');

    oidcClientsDetailPage.goTo();
    oidcClientsDetailPage.waitForPage();

    // let's regen the secret we've added the step before
    oidcClientsDetailPage.secretCardActionMenuToggle(1);
    oidcClientsDetailPage.secretCardMenu().getMenuItem('Regenerate').click();

    promptModal().getBody().should('be.visible');
    promptModal().clickActionButton('Regenerate Secret');

    // check data from network request
    cy.wait('@regenSecret').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.metadata.annotations['cattle.io/oidc-client-secret-regenerate']).to.equal('client-secret-2');
    });

    oidcClientsDetailPage.checkClientFullSecretCopyExists(1);
    oidcClientsDetailPage.clientFullSecretCopy(1).copyToClipboard();
  });

  it('should be able to delete a secret for an OIDC provider', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('deleteSecret');

    oidcClientsDetailPage.goTo();
    oidcClientsDetailPage.waitForPage();

    // let's remove the secret
    oidcClientsDetailPage.secretCardActionMenuToggle(1);
    oidcClientsDetailPage.secretCardMenu().getMenuItem('Remove').click();

    promptModal().getBody().should('be.visible');
    promptModal().clickActionButton('Delete Secret');

    // check data from network request
    cy.wait('@deleteSecret').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.metadata.annotations['cattle.io/oidc-client-secret-remove']).to.equal('client-secret-2');
    });

    // check that the card doesn't exist anymore
    cy.get('[data-testid="item-card-client-secret-2"]').should('not.exist');
  });

  it('should be able to delete an OIDC client application', () => {
    cy.intercept('DELETE', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('deleteRequest');

    OidcClientsPagePo.goTo('local');
    oidcClientsPage.waitForPage();

    oidcClientsPage.list().actionMenu(OIDC_CREATE_DATA.APP_NAME).getMenuItem('Delete').scrollIntoView()
      .click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteRequest');

    oidcClientsPage.waitForPage();
    cy.contains(OIDC_CREATE_DATA.APP_NAME).should('not.exist');
  });
});
