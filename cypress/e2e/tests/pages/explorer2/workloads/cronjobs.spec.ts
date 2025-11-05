import { WorkloadsCronJobsListPagePo, WorkloadsCronJobDetailPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-cronjobs.po';
import { WorkLoadsJobDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-jobs.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateCronJobsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/cronjobs/cronjobs-get';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

describe('CronJobs', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const localCluster = 'local';
  const cronJobListPage = new WorkloadsCronJobsListPagePo(localCluster);

  before(() => {
    cy.login();
  });

  describe('Details', () => {
    let cronJobName: string;
    let jobName: string;
    let podName: string;
    const defaultNamespace = 'default';

    before('set up', () => {
      // Create a cronjob for the test
      cy.getRootE2EResourceName().then((root) => {
        cronJobName = root;

        return cy.createRancherResource('v1', 'batch.cronjob', JSON.stringify({
          apiVersion: 'batch/v1',
          kind:       'CronJob',
          metadata:   {
            name:      cronJobName,
            namespace: defaultNamespace
          },
          spec: {
            schedule:                   '1 1 1 1 1', // basically never
            concurrencyPolicy:          'Allow',
            failedJobsHistoryLimit:     1,
            successfulJobsHistoryLimit: 3,
            suspend:                    false,
            jobTemplate:                {
              spec: {
                template: {
                  spec: {
                    containers:    [SMALL_CONTAINER],
                    restartPolicy: 'Never'
                  }
                }
              }
            }
          }
        }));
      });
    });

    it('Jobs list updates automatically in CronJob details page', () => {
      // Set namespace filter to include the test cronjob namespace
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ defaultNamespace }\"]}`);

      WorkloadsCronJobsListPagePo.navTo();
      cronJobListPage.waitForPage();

      // Trigger "Run Now" action which will create a new job and pod from the CronJob
      cy.intercept('POST', `v1/batch.jobs/${ defaultNamespace }`).as('runNow');
      cronJobListPage.runNow(cronJobName);
      cy.wait('@runNow').its('response.statusCode').should('eq', 201);

      // Retrieve the job and pod names created by the CronJob
      cy.getRancherResource('v1', 'batch.job', `${ defaultNamespace }`).then((resp) => {
        const job = resp.body.data.find((job: any) => job.metadata.name.startsWith(cronJobName));

        jobName = job.metadata.name;
        cy.getRancherResource('v1', 'pods', `${ defaultNamespace }`).then((resp) => {
          const pod = resp.body.data.find((pod: any) => pod.metadata.name.startsWith(cronJobName));

          podName = pod.metadata.name;

          // User is redirected to the job's details page after "Run Now"
          const jobDetailsPage = new WorkLoadsJobDetailsPagePo(jobName, undefined, 'local', defaultNamespace);

          jobDetailsPage.waitForPage(undefined, 'pods');

          // Verify job details page displays correct status
          // Job status should be Active
          jobDetailsPage.resourceDetail().masthead().resourceStatus(MEDIUM_TIMEOUT_OPT)
            .should('contain', 'Active');

          // Pod status should be Running
          jobDetailsPage.resourceDetail().resourceGauges().should('contain', 'Running');
          jobDetailsPage.resourceDetail().tabbedList('pods').resourceTableDetails(podName, 1).contains('Running', MEDIUM_TIMEOUT_OPT);
        });

        // Navigate back to CronJobs list page
        WorkloadsCronJobsListPagePo.navTo();
        cronJobListPage.waitForPage();

        // Verify CronJob status is Active in the list
        cronJobListPage.resourceTableDetails(cronJobName, 1).contains('Active');

        // Navigate to CronJob details page
        cronJobListPage.goToDetailsPage(cronJobName);

        const cronJobDetailsPage = new WorkloadsCronJobDetailPagePo(cronJobName, 'local', defaultNamespace);

        cronJobDetailsPage.waitForPage(undefined, 'jobs');

        // Verify CronJob status is Active in details page
        cronJobDetailsPage.resourceDetail().masthead().resourceStatus()
          .should('contain', 'Active');

        // Verify the job in the jobs tab shows correct status without manual page refresh
        // Testing https://github.com/rancher/dashboard/issues/14981:
        // The job list should update automatically and not show stale "In Progress" status
        cronJobDetailsPage.resourceDetail().tabbedList('jobs').resourceTableDetails(jobName, 1).contains('Active');
      });
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');
      // Delete the cronjob
      cy.deleteRancherResource('v1', 'batch.cronjob', `${ defaultNamespace }/${ cronJobName }`);
    });
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    let uniqueCronJob = SortableTablePo.firstByDefaultName('cronjob');
    let detailsPageCronJob = SortableTablePo.firstByDefaultName('detailscron');
    let cronJobNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let nsName3: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      const createCronJob = (cronJobName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = cronJobName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createRancherResource('v1', 'batch.cronjob', JSON.stringify({
            apiVersion: 'batch/v1',
            kind:       'CronJob',
            metadata:   {
              name,
              namespace: ns
            },
            spec: {
              schedule:                   '1 1 1 1 1', // basically never
              concurrencyPolicy:          'Allow',
              failedJobsHistoryLimit:     1,
              successfulJobsHistoryLimit: 3,
              suspend:                    false,
              jobTemplate:                {
                spec: {
                  template: {
                    spec: {
                      containers:    [SMALL_CONTAINER],
                      restartPolicy: 'Never'
                    }
                  }
                }
              }
            }
          }));
        };
      };

      cy.createManyNamespacedResources({
        context:        'cronjobs1',
        createResource: createCronJob(),
      })
        .then(({ ns, workloadNames }) => {
          cronJobNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => cy.createManyNamespacedResources({
          context:        'cronjobs2',
          createResource: createCronJob(uniqueCronJob),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          uniqueCronJob = workloadNames[0];
          nsName2 = ns;

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        })
        .then(() => cy.createManyNamespacedResources({
          context:        'cronjobs3',
          createResource: createCronJob(detailsPageCronJob),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          detailsPageCronJob = workloadNames[0];
          nsName3 = ns;
        });
    });

    it('pagination is visible and user is able to navigate through cronjobs data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsCronJobsListPagePo.navTo();
      cronJobListPage.waitForPage();

      // check cronjobs count
      const count = cronJobNamesList.length + 1;

      cy.waitForRancherResources('v1', 'batch.cronjob', count, true).then((resp: Cypress.Response<any>) => {
        // pagination is visible
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } CronJobs`);
          });

        // navigate to next page - right button
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } CronJobs`);
          });
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } CronJobs`);
          });
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } CronJobs`);
          });

        // navigate to first page - beginning button
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } CronJobs`);
          });
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        cronJobListPage.list().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('sorting changes the order of paginated cronjobs data', () => {
      WorkloadsCronJobsListPagePo.navTo();
      cronJobListPage.waitForPage();
      // use filter to only show test data
      cronJobListPage.list().resourceTable().sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      cronJobListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // cronjob name should be visible on first page (sorted in ASC order)
      cronJobListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      cronJobListPage.list().resourceTable().sortableTable().rowElementWithName(cronJobNamesList[0])
        .scrollIntoView()
        .should('be.visible');

      // sort by name in DESC order
      cronJobListPage.list().resourceTable().sortableTable().sort(2)
        .click({ force: true });
      cronJobListPage.list().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // cronjob name should be NOT visible on first page (sorted in DESC order)
      cronJobListPage.list().resourceTable().sortableTable().rowElementWithName(cronJobNamesList[0])
        .should('not.exist');

      // navigate to last page
      cronJobListPage.list().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // cronjob name should be visible on last page (sorted in DESC order)
      cronJobListPage.list().resourceTable().sortableTable().rowElementWithName(cronJobNamesList[0])
        .scrollIntoView()
        .should('be.visible');
    });

    it('filter cronjobs', () => {
      WorkloadsCronJobsListPagePo.navTo();
      cronJobListPage.waitForPage();

      cronJobListPage.list().resourceTable().sortableTable().checkVisible();
      cronJobListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      cronJobListPage.list().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      cronJobListPage.list().resourceTable().sortableTable().filter(cronJobNamesList[0]);
      cronJobListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      cronJobListPage.list().resourceTable().sortableTable().rowElementWithName(cronJobNamesList[0])
        .should('be.visible');

      // filter by namespace
      cronJobListPage.list().resourceTable().sortableTable().filter(nsName2);
      cronJobListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      cronJobListPage.list().resourceTable().sortableTable().rowElementWithName(uniqueCronJob)
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of cronjobs data
      generateCronJobsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsCronJobsListPagePo.navTo();
      cy.wait('@cronJobsDataSmall');
      cronJobListPage.waitForPage();

      cronJobListPage.list().resourceTable().sortableTable().checkVisible();
      cronJobListPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      cronJobListPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
      cronJobListPage.list().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after('clean up', () => {
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');
      // Delete namespaces (this will also delete all cronjobs including detailsPageCronJob)
      cy.deleteNamespace([nsName1, nsName2, nsName3]);
    });
  });
});
