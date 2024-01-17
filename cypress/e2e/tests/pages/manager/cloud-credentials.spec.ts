import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import CloudCredentialsPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Cloud Credentials', { testIsolation: 'off', tags: ['@manager', '@jenkins', '@adminUser', '@standardUser'] }, () => {
  const cloudCredentialsPage = new CloudCredentialsPagePo('_');
  const runTimestamp = +new Date();

  const cloudCredName = `e2e-cloud-cred-name-${ runTimestamp }`;
  const cloudCredDescription = `e2e-cloud-cred-description-${ runTimestamp }`;
  let cloudcredentialId = '';

  before(() => {
    cy.login();
  });

  it('can see error when authentication fails', () => {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.waitForPage();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(cloudCredName);
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(cloudCredDescription);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(`${ Cypress.env('awsSecretKey') }abc`, true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .click();
    cy.contains('Authentication test failed, please check your credentials').should('be.visible');
  });

  it('can create aws cloud credentials', () => {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().waitForPage('type=aws');
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(cloudCredName);
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(cloudCredDescription);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials')
      .then((req) => {
        cloudcredentialId = req.response?.body.id;
      });
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(cloudCredName, 2).should('be.visible');
  });

  it('can edit cloud credentials', () => {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.list().actionMenu(cloudCredName).getMenuItem('Edit Config').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=edit');
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(`${ cloudCredDescription }-edit`);
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('PUT', '/v3/cloudCredentials/**');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
  });

  it('can clone cloud credentials', () => {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.list().actionMenu(`${ cloudCredDescription }-edit`).getMenuItem('Clone').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=clone');
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(`${ cloudCredName }-clone`);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ cloudCredName }-clone`, 1).should('be.visible');
    cloudCredentialsPage.list().details(`${ cloudCredDescription }-edit`, 3).should('be.visible');
  });

  it('can delete cloud credentials', () => {
    CloudCredentialsPagePo.navTo();

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
    CloudCredentialsPagePo.navTo();

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
