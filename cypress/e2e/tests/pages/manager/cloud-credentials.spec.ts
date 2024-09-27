import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import CloudCredentialsPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Cloud Credentials', { testIsolation: 'off', tags: ['@manager', '@jenkins', '@adminUser', '@standardUser'] }, () => {
  const cloudCredentialsPage = new CloudCredentialsPagePo();
  let cloudcredentialId = '';

  before(() => {
    cy.login();

    cy.getRancherResource('v3', 'cloudCredentials').then((resp: Cypress.Response<any>) => {
      const credentials = resp.body.data;

      credentials.forEach( (credential) => {
        cy.deleteRancherResource('v3', 'cloudCredentials', credential.id.trim(), false);
      });
    });
  });

  beforeEach(() => {
    cy.createE2EResourceName('cloudCredential').as('cloudCredentialName');
  });

  it('can see error when authentication fails', function() {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.waitForPage();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(this.cloudCredentialName);
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(`${ this.cloudCredentialName }-description`);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(`${ Cypress.env('awsSecretKey') }abc`, true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .click();
    cy.contains('Authentication test failed, please check your credentials').should('be.visible');
  });

  it('can create aws cloud credentials', function() {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.create();
    cloudCredentialsPage.createEditCloudCreds().waitForPage();
    cloudCredentialsPage.createEditCloudCreds().cloudServiceOptions().selectSubTypeByIndex(0).click();
    cloudCredentialsPage.createEditCloudCreds().waitForPage('type=aws');
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(`${ this.cloudCredentialName }-description`);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');

    // Testing issue https://github.com/rancher/dashboard/issues/10424
    // making name a mandatory field with form validation + removal of "optional" from "name" placeholder
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().getAttributeValue('placeholder')
      .should('not.contain', 'optional');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .expectToBeDisabled();
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(this.cloudCredentialName);
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveOrCreate()
      .expectToBeEnabled();
    // EOT

    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials')
      .then((req) => {
        cloudcredentialId = req.response?.body.id;
      });
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(this.cloudCredentialName, 2).should('be.visible');
  });

  it('can edit cloud credentials', function() {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.list().actionMenu(this.cloudCredentialName).getMenuItem('Edit Config').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=edit');
    // Testing issue https://github.com/rancher/dashboard/issues/10424
    // we now allow for editing the "name" field
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(`${ this.cloudCredentialName }-name-edit`);
    // EOT
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().description().set(`${ this.cloudCredentialName }-description-edit`);
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('PUT', '/v3/cloudCredentials/**');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ this.cloudCredentialName }-name-edit`, 2).should('be.visible');
    cloudCredentialsPage.list().details(`${ this.cloudCredentialName }-description-edit`, 3).should('be.visible');
  });

  it('can clone cloud credentials', function() {
    CloudCredentialsPagePo.navTo();
    cloudCredentialsPage.list().actionMenu(`${ this.cloudCredentialName }-description-edit`).getMenuItem('Clone').click();
    cloudCredentialsPage.createEditCloudCreds(cloudcredentialId).waitForPage('mode=clone');
    cloudCredentialsPage.createEditCloudCreds().nameNsDescription().name().set(`${ this.cloudCredentialName }-clone`);
    cloudCredentialsPage.createEditCloudCreds().accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredentialsPage.createEditCloudCreds().secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredentialsPage.createEditCloudCreds().defaultRegion().checkOptionSelected('us-west-2');
    cloudCredentialsPage.createEditCloudCreds().saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials');
    cloudCredentialsPage.waitForPage();

    // check list details
    cloudCredentialsPage.list().details(`${ this.cloudCredentialName }-clone`, 1).should('be.visible');
    cloudCredentialsPage.list().details(`${ this.cloudCredentialName }-description-edit`, 3).should('be.visible');
  });

  it('can delete cloud credentials', function() {
    CloudCredentialsPagePo.navTo();

    // delete clone cloud credential
    cloudCredentialsPage.list().actionMenu(`${ this.cloudCredentialName }-clone`).getMenuItem('Delete').click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    cloudCredentialsPage.waitForPage();

    // check list details
    cy.contains(`${ this.cloudCredentialName }-clone`).should('not.exist');
  });

  it('can delete cloud credentials via bulk actions', function() {
    CloudCredentialsPagePo.navTo();

    // delete original cloud credential
    cloudCredentialsPage.list().resourceTable().sortableTable().rowSelectCtlWithName(`${ this.cloudCredentialName }-name-edit`)
      .set();
    cloudCredentialsPage.list().resourceTable().sortableTable().deleteButton()
      .click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', '/v3/cloudCredentials/**').as('deleteCloudCred');

    promptRemove.remove();
    cy.wait('@deleteCloudCred');
    cloudCredentialsPage.waitForPage();

    // check list details
    cy.contains(this.cloudCredentialName).should('not.exist');
  });
});
