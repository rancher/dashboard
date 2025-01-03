import { WorkloadsJobsListPagePo, WorkLoadsJobDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-jobs.po';

describe('Cluster Explorer', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    describe('Jobs', () => {
      const namespaceName = 'custom-namespace';
      const jobName = 'my-job-custom-name';
      const containerImageName = 'nginx';

      after(() => {
        // Delete the namespace created after the tests run
        cy.deleteRancherResource('v1', 'namespace', namespaceName);
      });

      it('Creating a job while creating a new namespace should succeed', () => {
        cy.intercept('POST', 'v1/namespaces').as('createNamespace');
        cy.intercept('POST', 'v1/batch.jobs').as('createJob');

        // list view jobs
        const workloadsJobsListPage = new WorkloadsJobsListPagePo('local');

        workloadsJobsListPage.goTo();
        workloadsJobsListPage.listCreate();

        // create view jobs
        const workloadsJobDetailsPage = new WorkLoadsJobDetailsPagePo('local');

        workloadsJobDetailsPage.selectNamespaceOption(1);
        workloadsJobDetailsPage.namespace().set(namespaceName);
        workloadsJobDetailsPage.name().set(jobName);
        workloadsJobDetailsPage.containerImage().set(containerImageName);
        workloadsJobDetailsPage.saveCreateForm().click();
        cy.wait('@createNamespace').its('response.statusCode').should('eq', 201);
        cy.wait('@createJob').its('response.statusCode').should('eq', 201);

        workloadsJobsListPage.listElementWithName(jobName).should('exist');

        // navigate to namespace and check existence of namespace
        cy.visit('/c/local/explorer/projectsnamespaces');
        workloadsJobsListPage.listElementWithName(namespaceName).should('exist');
      });

      it('Should be able to clone a job', () => {
        const jobName2 = `${ jobName }-2`;
        const jobNameClone = `${ jobName }-3`;

        // list view jobs
        const workloadsJobsListPage = new WorkloadsJobsListPagePo('local');

        workloadsJobsListPage.goTo();
        workloadsJobsListPage.listCreate();

        // create view jobs
        const workloadsJobDetailsPage = new WorkLoadsJobDetailsPagePo('local');

        workloadsJobDetailsPage.selectNamespaceOption(1);
        workloadsJobDetailsPage.namespace().set(namespaceName);
        workloadsJobDetailsPage.name().set(jobName2);
        workloadsJobDetailsPage.containerImage().set(containerImageName);
        workloadsJobDetailsPage.saveCreateForm().click();

        workloadsJobsListPage.listElementWithName(jobName2).should('exist');

        // Clone the job
        workloadsJobsListPage.list().actionMenu(jobName2).getMenuItem('Clone').click();

        const cloneJobDetailsPage = new WorkLoadsJobDetailsPagePo(jobName2, {}, 'local', namespaceName);

        cloneJobDetailsPage.waitForPage();
        cloneJobDetailsPage.name().set(jobNameClone);
        cloneJobDetailsPage.saveCreateForm().click();
        cloneJobDetailsPage.errorBanner().should('not.exist');

        workloadsJobsListPage.listElementWithName(jobNameClone).should('exist');
      });
    });
  });
});
