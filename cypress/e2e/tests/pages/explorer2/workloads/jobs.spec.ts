import { WorkloadsJobsListPagePo, WorkLoadsJobDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-jobs.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateJobsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/jobs/jobs-get';
import { deleteManyWorkloadNamespaces, SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

describe('Jobs', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const localCluster = 'local';

  before(() => {
    cy.login();
  });

  describe('CRUD', () => {
    const namespaceName = 'custom-namespace';
    const jobName = 'my-job-custom-name';
    const containerImageName = 'nginx';

    it('Creating a job while creating a new namespace should succeed', () => {
      cy.intercept('POST', 'v1/namespaces').as('createNamespace');
      cy.intercept('POST', 'v1/batch.jobs').as('createJob');

      // list view jobs
      const workloadsJobsListPage = new WorkloadsJobsListPagePo(localCluster);

      workloadsJobsListPage.goTo();
      workloadsJobsListPage.baseResourceList().masthead().create();

      // create view jobs
      const workloadsJobDetailsPage = new WorkLoadsJobDetailsPagePo(localCluster);

      workloadsJobDetailsPage.selectNamespaceOption(1);
      workloadsJobDetailsPage.namespace().set(namespaceName);
      workloadsJobDetailsPage.resourceDetail().createEditView().nameNsDescription().name()
        .set(jobName);
      workloadsJobDetailsPage.containerImage().set(containerImageName);
      workloadsJobDetailsPage.resourceDetail().createEditView().save();
      cy.wait('@createNamespace').its('response.statusCode').should('eq', 201);
      cy.wait('@createJob').its('response.statusCode').should('eq', 201);

      workloadsJobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobName)
        .should('exist');

      // navigate to namespace and check existence of namespace
      cy.visit('/c/local/explorer/projectsnamespaces');
      workloadsJobsListPage.list().resourceTable().sortableTable().rowElementWithName(namespaceName)
        .should('exist');
    });

    it('Should be able to clone a job', () => {
      const jobName2 = `${ jobName }-2`;
      const jobNameClone = `${ jobName }-3`;

      // list view jobs
      const workloadsJobsListPage = new WorkloadsJobsListPagePo('local');

      workloadsJobsListPage.goTo();
      workloadsJobsListPage.baseResourceList().masthead().create();

      // create view jobs
      const workloadsJobDetailsPage = new WorkLoadsJobDetailsPagePo('local');

      workloadsJobDetailsPage.selectNamespaceOption(1);
      workloadsJobDetailsPage.namespace().set(namespaceName);
      workloadsJobDetailsPage.resourceDetail().createEditView().nameNsDescription().name()
        .set(jobName2);
      workloadsJobDetailsPage.containerImage().set(containerImageName);
      workloadsJobDetailsPage.resourceDetail().createEditView().save();

      workloadsJobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobName2)
        .should('exist');

      // Clone the job
      workloadsJobsListPage.list().actionMenu(jobName2).getMenuItem('Clone').click();

      const cloneJobDetailsPage = new WorkLoadsJobDetailsPagePo(jobName2, {}, 'local', namespaceName);

      cloneJobDetailsPage.waitForPage();
      cloneJobDetailsPage.resourceDetail().createEditView().nameNsDescription().name()
        .set(jobNameClone);
      cloneJobDetailsPage.resourceDetail().createEditView().save();
      cloneJobDetailsPage.errorBanner().should('not.exist');

      workloadsJobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobNameClone)
        .should('exist');
    });

    after(() => {
      // Delete the namespace created after the tests run
      cy.deleteRancherResource('v1', 'namespace', namespaceName);
    });
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    const jobsListPage = new WorkloadsJobsListPagePo(localCluster);

    let uniqueJob = SortableTablePo.firstByDefaultName('job');
    const jobNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      cy.createE2EResourceName('ns1').then((ns1) => {
        nsName1 = ns1;
        // create namespace
        cy.createNamespace(nsName1);

        // create jobs
        let i = 0;

        while (i < 25) {
          const jobName = Cypress._.uniqueId(Date.now().toString());

          cy.createRancherResource('v1', 'batch.job', JSON.stringify({
            apiVersion: 'batch/v1',
            kind:       'Job',
            metadata:   {
              name:      jobName,
              namespace: nsName1
            },
            spec: {
              backoffLimit: 6,
              completions:  1,
              parallelism:  1,
              template:     {
                metadata: { labels: { 'job-name': jobName } },
                spec:     {
                  containers:    [SMALL_CONTAINER],
                  restartPolicy: 'Never'
                }
              }
            }
          })).then((resp) => {
            jobNamesList.push(resp.body.metadata.name);
          });

          i++;
        }

        cy.createE2EResourceName('ns2').then((ns2) => {
          nsName2 = ns2;

          // create namespace
          cy.createNamespace(nsName2);

          // create unique job for filtering/sorting test
          cy.createRancherResource('v1', 'batch.job', JSON.stringify({
            apiVersion: 'batch/v1',
            kind:       'Job',
            metadata:   {
              name:      uniqueJob,
              namespace: nsName2
            },
            spec: {
              backoffLimit: 6,
              completions:  1,
              parallelism:  1,
              template:     {
                metadata: { labels: { 'job-name': uniqueJob } },
                spec:     {
                  containers:    [SMALL_CONTAINER],
                  restartPolicy: 'Never'
                }
              }
            }
          })).then((resp) => {
            uniqueJob = resp.body.metadata.name;
          });

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
      });
    });

    it('pagination is visible and user is able to navigate through jobs data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsJobsListPagePo.navTo();
      jobsListPage.waitForPage();

      // check jobs count
      const count = jobNamesList.length + 1;

      cy.waitForRancherResources('v1', 'batch.job', count - 1, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Jobs`);
          });

        // navigate to next page - right button
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } Jobs`);
          });
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Jobs`);
          });
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } Jobs`);
          });

        // navigate to first page - beginning button
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Jobs`);
          });
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        jobsListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated jobs data', () => {
      WorkloadsJobsListPagePo.navTo();
      jobsListPage.waitForPage();
      // use filter to only show test data
      jobsListPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      jobsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // job name should be visible on first page (sorted in ASC order)
      jobsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      jobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      jobsListPage.list().resourceTable().sortableTable().sort(2)
        .click({ force: true });
      jobsListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // job name should be NOT visible on first page (sorted in DESC order)
      jobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobNamesList[0])
        .should('not.exist');

      // navigate to last page
      jobsListPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // job name should be visible on last page (sorted in DESC order)
      jobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter jobs', () => {
      WorkloadsJobsListPagePo.navTo();
      jobsListPage.waitForPage();

      jobsListPage.list().resourceTable().sortableTable().checkVisible();
      jobsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      jobsListPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      jobsListPage.list().resourceTable().sortableTable().filter(jobNamesList[0]);
      jobsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      jobsListPage.list().resourceTable().sortableTable().rowElementWithName(jobNamesList[0])
        .should('be.visible');

      // filter by namespace
      jobsListPage.list().resourceTable().sortableTable().filter(nsName2);
      jobsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      jobsListPage.list().resourceTable().sortableTable().rowElementWithName(uniqueJob)
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of jobs data
      generateJobsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsJobsListPagePo.navTo();
      cy.wait('@jobsDataSmall');
      jobsListPage.waitForPage();

      jobsListPage.list().resourceTable().sortableTable().checkVisible();
      jobsListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      jobsListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      jobsListPage.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all jobs in it)
      deleteManyWorkloadNamespaces([nsName1, nsName2]);
    });
  });
});
