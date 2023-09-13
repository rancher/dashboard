import { WorkloadsJobsListPagePo, WorkLoadsJobDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-jobs.po';

describe('Cluster Explorer', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Workloads', () => {
    describe('Jobs', () => {
      it('Creating a job while creating a new namespace should succeed', () => {
        const namespaceName = 'custom-namespace';
        const jobName = 'my-job-custom-name';
        const containerImageName = 'nginx';

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

        workloadsJobsListPage.listElementWithName(jobName).should('exist');

        // navigate to namespace and check existance of namespace
        cy.visit('/c/local/explorer/projectsnamespaces');
        workloadsJobsListPage.listElementWithName(namespaceName).should('exist');
      });
    });
  });
});
