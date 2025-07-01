import { WorkloadsCronJobsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-cronjobs.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateCronJobsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/cronjobs/cronjobs-get';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

describe('CronJobs', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  const localCluster = 'local';
  const cronJobListPage = new WorkloadsCronJobsListPagePo(localCluster);

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    let uniqueCronJob = SortableTablePo.firstByDefaultName('cronjob');
    const cronJobNamesList = [];
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

        // create cronjobs
        let i = 0;

        while (i < 25) {
          const cronJobName = Cypress._.uniqueId(Date.now().toString());

          cy.createRancherResource('v1', 'batch.cronjob', JSON.stringify({
            apiVersion: 'batch/v1',
            kind:       'CronJob',
            metadata:   {
              name:      cronJobName,
              namespace: nsName1
            },
            spec: {
              schedule:                   '*/1 * * * *',
              concurrencyPolicy:          'Allow',
              failedJobsHistoryLimit:     1,
              successfulJobsHistoryLimit: 3,
              suspend:                    false,
              jobTemplate:                {
                spec: {
                  template: {
                    spec: {
                      containers:    [SMALL_CONTAINER],
                      restartPolicy: 'OnFailure'
                    }
                  }
                }
              }
            }
          })).then((resp) => {
            cronJobNamesList.push(resp.body.metadata.name);
          });

          i++;
        }

        cy.createE2EResourceName('ns2').then((ns2) => {
          nsName2 = ns2;

          // create namespace
          cy.createNamespace(nsName2);

          // create unique cronjob for filtering/sorting test
          cy.createRancherResource('v1', 'batch.cronjob', JSON.stringify({
            apiVersion: 'batch/v1',
            kind:       'CronJob',
            metadata:   {
              name:      uniqueCronJob,
              namespace: nsName2
            },
            spec: {
              schedule:                   '*/1 * * * *',
              concurrencyPolicy:          'Allow',
              failedJobsHistoryLimit:     1,
              successfulJobsHistoryLimit: 3,
              suspend:                    false,
              jobTemplate:                {
                spec: {
                  template: {
                    spec: {
                      containers:    [SMALL_CONTAINER],
                      restartPolicy: 'OnFailure'
                    }
                  }
                }
              }
            }
          })).then((resp) => {
            uniqueCronJob = resp.body.metadata.name;
          });

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
      });
    });

    it('pagination is visible and user is able to navigate through cronjobs data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsCronJobsListPagePo.navTo();
      cronJobListPage.waitForPage();

      // check cronjobs count
      const count = cronJobNamesList.length + 1;

      cy.waitForRancherResources('v1', 'batch.cronjob', count - 1, true).then((resp: Cypress.Response<any>) => {
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

      // delete namespace (this will also delete all cronjobs in it)
      cy.deleteRancherResource('v1', 'namespaces', nsName1);
      cy.deleteRancherResource('v1', 'namespaces', nsName2);
    });
  });
});
