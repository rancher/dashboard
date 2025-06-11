import OidcClientsPagePo from '@/cypress/e2e/po/pages/users-and-auth/oidc-client.po';
import OidcClientsCreateEditPo from '@/cypress/e2e/po/edit/oidc-clients.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
// import { SECRET_ANNOTATION } from '@/shell/edit/management.cattle.io.oidcclient.vue';

// const SECRET_ANNOTATION = {
//   CREATE: 'cattle.io/oidc-client-secret-create',
//   REGEN:  'cattle.io/oidc-client-secret-regenerate',
//   REMOVE: 'cattle.io/oidc-client-secret-remove',
// };

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
  // const oidcClientsDetailPage = new OidcClientsCreateEditPo('local', OIDC_CREATE_DATA.APP_NAME);

  const newClientID = '';
  let newClientSecrets;
  // const newSecretId = '';
  // const newSecretLastFiveChars = '';

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
    cy.window().its('navigator.clipboard').invoke('readText')
      .should('contain', 'oidc-issuer');
    oidcClientsPage.list().discoveryDocument().copyToClipboard();
    cy.window().its('navigator.clipboard').invoke('readText')
      .should('contain', 'oidc-issuer/.well-known/openid-configuration');
    oidcClientsPage.list().jwksURI().copyToClipboard();
    cy.window().its('navigator.clipboard').invoke('readText')
      .should('contain', 'oidc-issuer/keys');

    // let's create an oidc client
    oidcClientsPage.createOidcClient();
    oidcClientsCreatePage.waitForPage();

    oidcClientsCreatePage.applicationName().set(OIDC_CREATE_DATA.APP_NAME);
    oidcClientsCreatePage.applicationDescription().set(OIDC_CREATE_DATA.APP_DESC);
    oidcClientsCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[0], 0);
    oidcClientsCreatePage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[1], 1);
    oidcClientsCreatePage.refreshTokenExpiration().setValue(OIDC_CREATE_DATA.REF_TOKEN_EXP);
    oidcClientsCreatePage.tokenExpiration().setValue(OIDC_CREATE_DATA.TOKEN_EXP);

    oidcClientsCreatePage.saveCreateForm().createEditView().create();

    // check data from network request
    cy.wait('@createRequest').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      // newClientID = response?.body.status.clientID;
      // newClientSecrets = response?.body.status.clientSecrets;

      expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
      expect(response?.body.spec.description).to.equal(OIDC_CREATE_DATA.APP_DESC);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_CREATE_DATA.CB_URLS[0]);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_CREATE_DATA.CB_URLS[1]);
      expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_CREATE_DATA.REF_TOKEN_EXP);
      expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_CREATE_DATA.TOKEN_EXP);
    });

    // // since a CREATE doesn't yield the clientID and secrets, let's refresh the page and intercept the GET
    // cy.intercept('GET', `/v1/management.cattle.io.oidcclients?exclude=metadata.managedFields`).as('getRequest');

    // // let's load it all again to force the data GET
    // oidcClientsPage.goTo('local');
    // oidcClientsPage.waitForPage();

    // // check data from network request
    // cy.wait('@getRequest').then(({ request, response }) => {
    //   expect(response?.statusCode).to.eq(200);
    //   const newOidc = response?.body?.data?.find((item) => item.id === OIDC_CREATE_DATA.APP_NAME);

    //   newClientID = newOidc.status.clientID;
    //   newClientSecrets = newOidc.status.clientSecrets;

    //   oidcClientsPage.list().details(OIDC_CREATE_DATA.APP_NAME, 2).find('a').scrollIntoView()
    //     .click();
    //   oidcClientsDetailPage.waitForPage();

    //   // should be able to copy the client ID
    //   oidcClientsDetailPage.clientID().copyToClipboard();
    //   cy.window().its('navigator.clipboard').invoke('readText').should('contain', newClientID);

    //   // CAN'T TEST THIS BECAUSE WE REFRESHED THE PAGE TO GET THE DATA!!!
    //   // should be able to copy the full secret after creation of an OIDC client
    //   // oidcClientsCreatePage.clientFullSecretCopy(0).copyToClipboard();
    //   // cy.window().its('navigator.clipboard').invoke('readText').should('contain', newClientSecrets[0].lastFiveCharacters);
    // });
  });

  it('should be able to edit an OIDC client application', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('editRequest');

    OidcClientsPagePo.goTo('local');
    oidcClientsPage.waitForPage();
    oidcClientsPage.list().actionMenu(OIDC_CREATE_DATA.APP_NAME).getMenuItem('Edit Config').scrollIntoView()
      .click();

    // oidcClientsEditPage.goTo();
    // oidcClientsEditPage.waitForPage();

    oidcClientsEditPage.applicationDescription().set(OIDC_EDIT_DATA.APP_DESC);
    oidcClientsEditPage.callbackUrls().clearListItem(0);
    oidcClientsEditPage.callbackUrls().clearListItem(1);
    oidcClientsEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[0], 0, false);
    oidcClientsEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[1], 1, false);
    oidcClientsEditPage.refreshTokenExpiration().setValue(OIDC_EDIT_DATA.REF_TOKEN_EXP);
    oidcClientsEditPage.tokenExpiration().setValue(OIDC_EDIT_DATA.TOKEN_EXP);

    oidcClientsEditPage.saveCreateForm().createEditView().save();

    // check data from network request
    cy.wait('@editRequest').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(newClientID).to.equal(response?.body.status.clientID);
      expect(JSON.stringify(newClientSecrets)).to.equal(JSON.stringify(response?.body.status.clientSecrets));
      expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
      expect(response?.body.spec.description).to.equal(OIDC_EDIT_DATA.APP_DESC);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_EDIT_DATA.CB_URLS[0]);
      expect(response?.body.spec.redirectURIs).to.include(OIDC_EDIT_DATA.CB_URLS[1]);
      expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.REF_TOKEN_EXP);
      expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.TOKEN_EXP);
    });
  });

  // it('should be able to add a new secret for an OIDC provider', () => {
  //   cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('addNewSecret');

  //   oidcClientsDetailPage.goTo();
  //   oidcClientsDetailPage.waitForPage();

  //   oidcClientsDetailPage.addNewSecretBtnClick();

  //   // check data from network request
  //   cy.wait('@addNewSecret').then(({ request, response }) => {
  //     expect(response?.statusCode).to.eq(200);
  //     expect(request.body.metadata.annotations[SECRET_ANNOTATION.CREATE]).to.equal('true');

  //     // WE CAN'T DO THIS BECAUSE SECRETS ARE CREATED ASYNC, UNDER THE HOOD! NO XHR!
  //     // const secretsData = response?.body.status.clientSecrets;
  //     // const secretKeys = Object.keys(secretsData);

  //     // newSecretId = secretKeys[1];
  //     // newSecretLastFiveChars = secretsData[secretKeys[1]].lastFiveCharacters;

  //     // this means that now there's two secrets available
  //     expect(response?.body.status.clientSecrets.length).to.equal(2);
  //   });

  //   // should be able to copy the full secret after creation of a new secret
  //   oidcClientsDetailPage.clientFullSecretCopy(1).copyToClipboard();
  //   // cy.window().its('navigator.clipboard').invoke('readText').should('contain', newSecretLastFiveChars);
  // });

  // it('should be able to regenerate a secret for an OIDC provider', () => {
  //   cy.intercept('PUT', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('regenSecret');
  //   let regenSecretLastFiveChars;

  //   oidcClientsDetailPage.goTo();
  //   oidcClientsDetailPage.waitForPage();

  //   // let's regen the secret we've added the step before
  //   oidcClientsDetailPage.regenSecretBtnClick(1);

  //   // check data from network request
  //   cy.wait('@regenSecret').then(({ request, response }) => {
  //     expect(response?.statusCode).to.eq(200);
  //     expect(request.body.metadata.annotations[SECRET_ANNOTATION.REGEN]).to.equal(newSecretId);

  //     const secretsData = response?.body.status.clientSecrets;
  //     const secretKeys = Object.keys(secretsData);

  //     regenSecretLastFiveChars = secretsData[secretKeys[1]].lastFiveCharacters;
  //     expect(secretsData.length).to.equal(2);
  //   });

  //   // should be able to copy the full secret after regeneration
  //   oidcClientsDetailPage.clientFullSecretCopy(1).copyToClipboard();
  //   // cy.window().its('navigator.clipboard').invoke('readText').should('contain', regenSecretLastFiveChars);
  // });

  // // it('should be able to delete a secret for an OIDC provider', () => {
  // //   cy.intercept('PUT', `/v1/management.cattle.io.oidcclients`).as('deleteSecret');

  // //   oidcClientsDetailPage.goTo();
  // //   oidcClientsDetailPage.waitForPage();

  // //   // let's regen the secret we've added the step before
  // //   oidcClientsDetailPage.regenSecretBtnClick(1);

  // //   // check data from network request
  // //   cy.wait('@deleteSecret').then(({ request, response }) => {
  // //     expect(response?.statusCode).to.eq(200);
  // //     expect(request.body.metadata.annotations[SECRET_ANNOTATION.REMOVE]).to.equal(newSecretId);

  // //     const secretsData = response?.body.status.clientSecrets;

  // //     expect(secretsData.length).to.equal(1);
  // //   });
  // // });

  it('should be able to delete an OIDC client application', () => {
    cy.intercept('DELETE', `/v1/management.cattle.io.oidcclients/${ OIDC_CREATE_DATA.APP_NAME }`).as('deleteRequest');

    OidcClientsPagePo.goTo('local');
    oidcClientsPage.waitForPage();
    // TODO: fix possible menu problem
    oidcClientsPage.list().actionMenu(OIDC_CREATE_DATA.APP_NAME).getMenuItem('Delete').scrollIntoView()
      .click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteRequest');

    oidcClientsPage.waitForPage();
    cy.contains(OIDC_CREATE_DATA.APP_NAME).should('not.exist');
  });
});
