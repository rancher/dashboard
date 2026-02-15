import OidcClientsPagePo from '@/cypress/e2e/po/pages/users-and-auth/oidc-client.po';
import OidcClientCreateEditPo from '~/cypress/e2e/po/edit/management.cattle.io.oidcclient.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { promptModal } from '@/cypress/e2e/po/prompts/shared/modalInstances.po';
import OIDCClientDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.oidcclient.po';

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

  const clusterId = '_';

  const oidcClientsPage = new OidcClientsPagePo(clusterId);
  const oidcClientDetailPage = new OIDCClientDetailPo(clusterId, OIDC_CREATE_DATA.APP_NAME);
  const oidcClientCreatePage = new OidcClientCreateEditPo(clusterId);
  const oidcClientEditPage = new OidcClientCreateEditPo(clusterId, OIDC_CREATE_DATA.APP_NAME, true);

  before(() => {
    cy.login();
  });

  it('should be able to create an OIDC client application', () => {
    cy.intercept('POST', `/v1/management.cattle.io.oidcclients`).as('createRequest');

    oidcClientsPage.goTo();
    oidcClientsPage.waitForPage();

    // check title and list view
    oidcClientsPage.list().title().should('contain', 'OIDC Apps');
    oidcClientsPage.list().resourceTable().sortableTable().checkVisible();
    oidcClientsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

    // should be able to copy OIDC urls on list view
    oidcClientsPage.list().issuerURL().copyToClipboard();
    oidcClientsPage.list().discoveryDocument().copyToClipboard();
    oidcClientsPage.list().jwksURI().copyToClipboard();

    // let's create an oidc client
    oidcClientsPage.createOidcClient();
    oidcClientCreatePage.waitForPage();

    oidcClientCreatePage.nameNsDescription().name().set(OIDC_CREATE_DATA.APP_NAME);
    oidcClientCreatePage.nameNsDescription().description().set(OIDC_CREATE_DATA.APP_DESC);
    oidcClientCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[0], 0, 'Add Callback URL');
    oidcClientCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[1], 1, 'Add Callback URL');
    oidcClientCreatePage.refreshTokenExpiration().setValue(OIDC_CREATE_DATA.REF_TOKEN_EXP);
    oidcClientCreatePage.tokenExpiration().setValue(OIDC_CREATE_DATA.TOKEN_EXP);

    oidcClientCreatePage.saveCreateForm().createEditView().create();

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

    oidcClientDetailPage.waitForPage();

    oidcClientDetailPage.clientID().exists();
    oidcClientDetailPage.clientFullSecretCopy(0).exists();

    oidcClientDetailPage.clientID().copyToClipboard();
    oidcClientDetailPage.clientFullSecretCopy(0).copyToClipboard();
  });

  it('should be able to edit an OIDC client application', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('editRequest');

    OidcClientsPagePo.goTo();
    oidcClientsPage.waitForPage();
    oidcClientsPage.list().actionMenu(OIDC_CREATE_DATA.APP_NAME).getMenuItem('Edit Config').scrollIntoView()
      .click();

    oidcClientEditPage.nameNsDescription().description().set(OIDC_EDIT_DATA.APP_DESC);
    oidcClientEditPage.callbackUrls().clearListItem(0);
    oidcClientEditPage.callbackUrls().clearListItem(1);
    oidcClientEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[0], 0, 'Add Callback URL', undefined, false);
    oidcClientEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[1], 1, 'Add Callback URL', undefined, false);
    oidcClientEditPage.refreshTokenExpiration().setValue(OIDC_EDIT_DATA.REF_TOKEN_EXP);
    oidcClientEditPage.tokenExpiration().setValue(OIDC_EDIT_DATA.TOKEN_EXP);

    oidcClientEditPage.saveCreateForm().createEditView().save();

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

    oidcClientDetailPage.goTo();
    oidcClientDetailPage.waitForPage();

    oidcClientDetailPage.addNewSecretBtnClick();

    // check data from network request
    cy.wait('@addNewSecret').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.metadata.annotations['cattle.io/oidc-client-secret-create']).to.equal('true');
    });

    // Wait for the page to refresh and show the new secret
    oidcClientDetailPage.waitForPage();
    oidcClientDetailPage.clientFullSecretCopy(1).exists();
    oidcClientDetailPage.clientFullSecretCopy(1).copyToClipboard();
  });

  it('should be able to regenerate a secret for an OIDC provider', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('regenSecret');

    oidcClientDetailPage.goTo();
    oidcClientDetailPage.waitForPage();

    // let's regen the secret we've added the step before
    oidcClientDetailPage.secretCardActionMenuToggle(1);
    oidcClientDetailPage.secretCardMenu().getMenuItem('Regenerate').click();

    promptModal().getBody().should('be.visible');
    promptModal().clickActionButton('Regenerate Secret');

    // check data from network request
    cy.wait('@regenSecret').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.metadata.annotations['cattle.io/oidc-client-secret-regenerate']).to.equal('client-secret-2');
    });

    oidcClientDetailPage.clientFullSecretCopy(1).exists();
    oidcClientDetailPage.clientFullSecretCopy(1).copyToClipboard();
  });

  it('should be able to delete a secret for an OIDC provider', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('deleteSecret');

    oidcClientDetailPage.goTo();
    oidcClientDetailPage.waitForPage();

    // let's remove the secret
    oidcClientDetailPage.secretCardActionMenuToggle(1);
    oidcClientDetailPage.secretCardMenu().getMenuItem('Delete').click();

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

    OidcClientsPagePo.goTo();
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
