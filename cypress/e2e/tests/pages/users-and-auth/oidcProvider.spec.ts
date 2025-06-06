import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { isMatch } from 'lodash';
// import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import OidcClientsPagePo from '@/cypress/e2e/po/pages/users-and-auth/oidc-client.po';
import OidcClientsCreateEditPo from '@/cypress/e2e/po/edit/oidc-clients.po';
// import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
// import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
// import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

describe('Rancher as an OIDC Provider', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {
  const oidcClientsPage = new OidcClientsPagePo();
  const oidcClientsCreateEditPage = new OidcClientsCreateEditPo();

  const OIDC_CREATE_DATA = {
    APP_NAME: 'some-app-name',
    APP_DESC: 'some-app-desc',
    CB_URLS:  [
      'https://some-dummy-url-1.com',
      'https://some-dummy-url-2.com'
    ],
    REF_TOKEN_EXP: '3800',
    TOKEN_EXP:     '800'
  };

  const OIDC_EDIT_DATA = {
    APP_NAME: 'some-app-name',
    APP_DESC: 'some-app-desc1',
    CB_URLS:  [
      'https://some-dummy-url-11.com',
      'https://some-dummy-url-21.com'
    ],
    REF_TOKEN_EXP: '3801',
    TOKEN_EXP:     '801'
  };

  const newClientID = '';
  let newClientSecrets;

  // const featureFlagsPage = new FeatureFlagsPagePo();
  // const burgerMenu = new BurgerMenuPo();

  before(() => {
    cy.login();
  });

  // it('should be able to create an OIDC client application', () => {
  //   cy.intercept('POST', `/v1/management.cattle.io.oidcclients`).as('createRequest');
  //   const createRequestPayload = {
  //     type:     'management.cattle.io.oidcclient',
  //     metadata: { name: OIDC_CREATE_DATA.APP_NAME },
  //     spec:     {
  //       description:                   OIDC_CREATE_DATA.APP_DESC,
  //       refreshTokenExpirationSeconds: OIDC_CREATE_DATA.REF_TOKEN_EXP,
  //       tokenExpirationSeconds:        OIDC_CREATE_DATA.TOKEN_EXP,
  //       redirectURIs:                  [OIDC_CREATE_DATA.CB_URLS[0], OIDC_CREATE_DATA.CB_URLS[1]]
  //     }
  //   };

  //   OidcClientsPagePo.goTo('local');
  //   oidcClientsPage.waitForPage();

  //   // check title and list view
  //   oidcClientsPage.title().should('be.visible');
  //   oidcClientsPage.list().resourceTable().sortableTable().checkVisible();
  //   oidcClientsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();

  //   // should be able to copy OIDC urls on list view (FLIMSY)
  //   oidcClientsPage.list().issuerURL().copyToClipboard();
  //   cy.window().its('navigator.clipboard').invoke('readText').should('contain', 'oidc-issuer');
  //   oidcClientsPage.list().discoveryDocument().copyToClipboard();
  //   cy.window().its('navigator.clipboard').invoke('readText').should('contain', 'oidc-issuer/.well-known/openid-configuration');
  //   oidcClientsPage.list().jwksURI().copyToClipboard();
  //   cy.window().its('navigator.clipboard').invoke('readText').should('contain', 'oidc-issuer/keys');

  //   // let's create an oidc client
  //   oidcClientsPage.createOidcClient();
  //   oidcClientsCreateEditPage.waitForPage();

  //   oidcClientsCreateEditPage.applicationName().set(OIDC_CREATE_DATA.APP_NAME);
  //   oidcClientsCreateEditPage.applicationDescription().set(OIDC_CREATE_DATA.APP_DESC);
  //   oidcClientsCreateEditPage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[0], 0);
  //   oidcClientsCreateEditPage.callbackUrls().setValueAtIndex(OIDC_CREATE_DATA.CB_URLS[1], 1);
  //   oidcClientsCreateEditPage.refreshTokenExpiration().setValue(OIDC_CREATE_DATA.REF_TOKEN_EXP);
  //   oidcClientsCreateEditPage.tokenExpiration().setValue(OIDC_CREATE_DATA.TOKEN_EXP);

  //   // oidcClientsCreateEditPage.saveCreateForm().createEditView().create();

  //   // // check data from network request
  //   // cy.wait('@createRequest').then(({ request, response }) => {
  //   //   expect(response?.statusCode).to.eq(201);
  //   //   expect(isMatch(request.body, createRequestPayload)).to.equal(true);
  //   //   newClientID = response?.body.status.clientID;
  //   //   newClientSecrets = response?.body.status.clientSecrets;

  //   //   expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
  //   //   expect(response?.body.spec.description).to.equal(OIDC_CREATE_DATA.APP_DESC);
  //   //   expect(response?.body.spec.redirectURIs).to.equal(OIDC_EDIT_DATA.CB_URLS);
  //   //   expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.REF_TOKEN_EXP);
  //   //   expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.TOKEN_EXP);
  //   // });
  // });

  it('should be able to edit an OIDC client application', () => {
    cy.intercept('PUT', `/v1/management.cattle.io.oidcclients`).as('editRequest');
    const editRequestPayload = {
      type:     'management.cattle.io.oidcclient',
      metadata: { name: OIDC_CREATE_DATA.APP_NAME },
      spec:     {
        description:                   OIDC_EDIT_DATA.APP_DESC,
        refreshTokenExpirationSeconds: OIDC_EDIT_DATA.REF_TOKEN_EXP,
        tokenExpirationSeconds:        OIDC_EDIT_DATA.TOKEN_EXP,
        redirectURIs:                  [OIDC_EDIT_DATA.CB_URLS[0], OIDC_EDIT_DATA.CB_URLS[1]]
      }
    };

    OidcClientsPagePo.goTo('local');
    oidcClientsPage.waitForPage();
    oidcClientsPage.list().actionMenu('oidc-client-test').getMenuItem('Edit Config').scrollIntoView()
      .click();

    oidcClientsCreateEditPage.waitForPage();

    oidcClientsCreateEditPage.applicationDescription().set(OIDC_EDIT_DATA.APP_DESC);
    oidcClientsCreateEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[0], 0);
    oidcClientsCreateEditPage.callbackUrls().setValueAtIndex(OIDC_EDIT_DATA.CB_URLS[1], 1);
    oidcClientsCreateEditPage.refreshTokenExpiration().setValue(OIDC_EDIT_DATA.REF_TOKEN_EXP);
    oidcClientsCreateEditPage.tokenExpiration().setValue(OIDC_EDIT_DATA.TOKEN_EXP);

    // oidcClientsCreateEditPage.saveCreateForm().createEditView().save();

  //   // check data from network request
  //   cy.wait('@editRequest').then(({ request, response }) => {
  //     expect(response?.statusCode).to.eq(201);
  //     expect(isMatch(request.body, editRequestPayload)).to.equal(true);
  //     expect(newClientID).to.equal(response?.body.status.clientID);
  //     expect(newClientSecrets).to.equal(response?.body.status.clientSecrets);
  //     expect(response?.body.metadata.name).to.equal(OIDC_CREATE_DATA.APP_NAME);
  //     expect(response?.body.spec.description).to.equal(OIDC_EDIT_DATA.APP_DESC);
  //     expect(response?.body.spec.redirectURIs).to.equal(OIDC_EDIT_DATA.CB_URLS);
  //     expect(response?.body.spec.refreshTokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.REF_TOKEN_EXP);
  //     expect(response?.body.spec.tokenExpirationSeconds).to.equal(OIDC_EDIT_DATA.TOKEN_EXP);
  //   });
  });

  // it('should be able to manage client secrets for an OIDC provider', () => {
  //   // add a new secret and copy token
  //   // regen a secret
  //   // remove a secret
  // });

  // it('should be able to delete an OIDC client application', () => {
  //   //
  // });
});
