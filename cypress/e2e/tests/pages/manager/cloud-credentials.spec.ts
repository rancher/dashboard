import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import CloudCredentialsPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Cloud Credentials', { testIsolation: 'off', tags: ['@manager', '@jenkins', '@adminUser', '@standardUser'] }, () => {
  const cloudCredentialsPage = new CloudCredentialsPagePo();
  const runTimestamp = +new Date();

  const cloudCredName = `e2e-cloud-cred-name-${ runTimestamp }`;
  const cloudCredDescription = `e2e-cloud-cred-description-${ runTimestamp }`;
  let cloudcredentialId = '';

  before(() => {
    cy.login();
  });

  it('can navigate to Cloud Credentials page', () => {
    const clusterList = new ClusterManagerListPagePo('local');
    const sideNav = new ProductNavPo();

    clusterList.goTo();
    sideNav.groups().contains('RKE1 Configuration').click();
    sideNav.navToSideMenuEntryByLabel('Cloud Credentials');
    cloudCredentialsPage.waitForPage();
  });

  it('can see error when authentication fails', () => {
    cloudCredentialsPage.goTo();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().name().set(cloudCredName);
    cloudCredentialsPage.createEditCloudCreds().description().set(cloudCredDescription);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(`${ Cypress.env('awsSecretKey') }abc`, true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().click();
    cy.contains('Authentication test failed, please check your credentials').should('be.visible');
  });

  it('can create cloud credentials', () => {
    cloudCredentialsPage.goTo();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().name().set(cloudCredName);
    cloudCredentialsPage.createEditCloudCreds().description().set(cloudCredDescription);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      cloudcredentialId = req.response?.body.id;
    });
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(cloudCredName, 2).should('be.visible');
  });

  it('can edit cloud credentials', () => {
    cloudCredentialsPage.goTo();
    cloudCredentialsPage.list().actionMenu(cloudCredName).getMenuItem('Edit Config').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=edit');
    cloudCredentialsPage.createEditCloudCreds().description().set(`${ cloudCredDescription }-edit`);
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('PUT', '/v3/cloudCredentials/**');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
  });

  it('can clone cloud credentials', () => {
    cloudCredentialsPage.goTo();
    cloudCredentialsPage.list().actionMenu(`${ cloudCredDescription }-edit`).getMenuItem('Clone').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=clone');
    cloudCredentialsPage.createEditCloudCreds().name().set(`${ cloudCredName }-clone`);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveAndWaitForRequests('POST', '/v3/cloudcredentials');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ cloudCredName }-clone`, 1).should('be.visible');
    cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
  });

  it('can delete cloud credentials', () => {
    cloudCredentialsPage.goTo();

    // delete clone cloud credential
    cloudCredentialsPage.list().actionMenu(`${ cloudCredName }-clone`).getMenuItem('Delete').click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    cloudCredentialsPage.waitForPage();

    // check list details
    cy.contains(`${ cloudCredName }-clone`).should('not.exist');
  });

  it('can delete cloud credentials via bulk actions', () => {
    cloudCredentialsPage.goTo();

    // delete original cloud credential
    cloudCredentialsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(cloudCredName)
      .set();
    cloudCredentialsPage.list().resourceTable().sortableTable().deleteButton()
      .click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    cloudCredentialsPage.waitForPage();

    // check list details
    cy.contains(cloudCredName).should('not.exist');
  });
});
