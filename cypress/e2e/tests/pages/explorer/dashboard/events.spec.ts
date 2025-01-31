import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { EventsPagePo } from '@/cypress/e2e/po/pages/explorer/events.po';
import { generateEventsDataSmall } from '@/cypress/e2e/blueprints/explorer/cluster/events';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

const cluster = 'local';
const clusterDashboard = new ClusterDashboardPagePo(cluster);
const events = new EventsPagePo(cluster);
const pageSize = 10;
// Should be enough to create at least 3 pages of events
const podCount = 15;

const countHelper = {
  setupCount: (vaiCacheEnabled: boolean, initialCount: number) => {
    if (vaiCacheEnabled) {
      cy.intercept('GET', '/v1/events?*').as('getCount');
    } else {
      cy.wrap(initialCount).as('count');
    }
  },
  handleCount: (vaiCacheEnabled) => {
    if (vaiCacheEnabled) {
      cy.wait('@getCount').then((interception) => {
        cy.wrap(interception.response.body.count).as('count');
      });
    }
  },
  getCount: () => cy.get('@count').then((count) => count as any as number),
};

describe('Events', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    let uniquePod = SortableTablePo.firstByDefaultName('pod');
    const podNamesList = [];
    let nsName1: string;
    let nsName2: string;

    before('set up', () => {
      cy.tableRowsPerPageAndPreferences(pageSize, {
        clusterName:     cluster,
        groupBy:         'none',
        namespaceFilter: '{\"local\":[]}',
        allNamespaces:   'true',
      });

      cy.createE2EResourceName('ns1').then((ns1) => {
        nsName1 = ns1;
        // create namespace
        cy.createNamespace(nsName1);

        // create pods
        let i = 0;

        while (i < podCount) {
          const podName = Cypress._.uniqueId(Date.now().toString());

          cy.createPod(nsName1, podName, 'nginx:latest', false, { createNameOptions: { prefixContext: true } }).then((resp) => {
            podNamesList.push(resp.body.metadata.name);
          });

          i++;
        }
      });

      cy.createE2EResourceName('ns2').then((ns2) => {
        nsName2 = ns2;

        // create namespace
        cy.createNamespace(nsName2);

        // create unique pod for filtering/sorting test
        cy.createPod(nsName2, uniquePod, 'nginx:latest', true, { createNameOptions: { prefixContext: true } }).then((resp) => {
          uniquePod = resp.body.metadata.name;
        });
      });

      // I'm loathed to do this, but the events created from the pods need to settle before we start
      cy.wait(20000); // eslint-disable-line cypress/no-unnecessary-waiting
    });

    it('pagination is visible and user is able to navigate through events data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } });

      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();

      let vaiCacheEnabled = false;

      cy.isVaiCacheEnabled()
        .then((isVaiCacheEnabled) => {
          vaiCacheEnabled = isVaiCacheEnabled;

          return cy.getRancherResource('v1', 'events');
        })
        .then((resp: Cypress.Response<any>) => {
          let initialCount = resp.body.count;

          if (!vaiCacheEnabled && resp.body.count > 500) {
            // Why 500? there's a hardcoded figure to stops ui from storing more than 500 events ...
            initialCount = 500;
          }

          // Test break down if less than 3 pages...
          expect(initialCount).to.be.greaterThan(3 * pageSize);

          // pagination is visible
          events.sortableTable().pagination().checkVisible();

          const loadingPo = new LoadingPo('.title .resource-loading-indicator');

          loadingPo.checkNotExists();

          // basic checks on navigation buttons
          events.sortableTable().pagination().beginningButton().isDisabled();
          events.sortableTable().pagination().leftButton().isDisabled();
          events.sortableTable().pagination().rightButton().isEnabled();
          events.sortableTable().pagination().endButton().isEnabled();

          // check text before navigation
          events.sortableTable().pagination().self().scrollIntoView();
          events.sortableTable().pagination().paginationText().then((el) => {
            expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ initialCount } Events`);
          });

          // navigate to next page - right button
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.sortableTable().pagination().rightButton().click();
          countHelper.handleCount(vaiCacheEnabled);

          // check text and buttons after navigation
          events.sortableTable().pagination().self().scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.sortableTable().pagination().paginationText().then((el) => {
              expect(el.trim()).to.eq(`${ pageSize + 1 } - ${ 2 * pageSize } of ${ count } Events`);
            });
          });
          events.sortableTable().pagination().beginningButton().isEnabled();
          events.sortableTable().pagination().leftButton().isEnabled();

          // navigate to first page - left button
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.sortableTable().pagination().leftButton().click();
          countHelper.handleCount(vaiCacheEnabled);

          // check text and buttons after navigation
          events.sortableTable().pagination().self().scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.sortableTable().pagination().paginationText().then((el) => {
              expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ count } Events`);
            });
          });

          events.sortableTable().pagination().beginningButton().isDisabled();
          events.sortableTable().pagination().leftButton().isDisabled();

          // navigate to last page - end button
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.sortableTable().pagination().endButton().scrollIntoView()
            .click();
          countHelper.handleCount(vaiCacheEnabled);

          // check text after navigation
          events.sortableTable().pagination().self().scrollIntoView();
          countHelper.getCount().then((count) => {
            return events.sortableTable().pagination().paginationText().then((el) => {
              let pages = Math.floor(count / pageSize);

              if (count % pageSize === 0) {
                pages--;
              }
              const from = (pages * pageSize) + 1;
              const to = count;

              expect(el.trim()).to.eq(`${ from } - ${ to } of ${ to } Events`);
            });
          });

          // navigate to first page - beginning button
          countHelper.setupCount(vaiCacheEnabled, initialCount);
          events.sortableTable().pagination().beginningButton().click();
          countHelper.handleCount(vaiCacheEnabled);

          // check text and buttons after navigation
          events.sortableTable().pagination().self().scrollIntoView();
          countHelper.getCount().then((count) => {
            events.sortableTable().pagination().paginationText().then((el) => {
              expect(el.trim()).to.eq(`1 - ${ pageSize } of ${ count } Events`);
            });
          });

          events.sortableTable().pagination().beginningButton().isDisabled();
          events.sortableTable().pagination().leftButton().isDisabled();
        });
    });

    it('filter events', () => {
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, pageSize);

      // filter by namespace
      events.sortableTable().filter(nsName2);
      events.waitForPage(`q=${ nsName2 }`);
      events.eventslist().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.sortableTable().rowElementWithPartialName(uniquePod).should('be.visible');

      // filter by name
      events.sortableTable().filter(uniquePod);
      events.waitForPage(`q=${ uniquePod }`);
      events.eventslist().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.sortableTable().rowElementWithPartialName(uniquePod).should('be.visible');

      events.sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated events data', () => {
      EventsPagePo.navTo();
      events.waitForPage();

      // check table is sorted by `last seen` in ASC order by default
      events.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // sort by name in ASC order
      events.sortableTable().sort(11).click();
      events.sortableTable().tableHeaderRow().checkSortOrder(11, 'down');

      // event name should be visible on first page (sorted in ASC order)
      events.sortableTable().tableHeaderRow().self().scrollIntoView();
      events.sortableTable().rowElementWithPartialName(uniquePod).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      events.sortableTable().sort(11).click();
      events.sortableTable().tableHeaderRow().checkSortOrder(11, 'up');

      // event name should be NOT visible on first page (sorted in DESC order)
      events.sortableTable().rowElementWithPartialName(uniquePod).should('not.exist');

      // navigate to last page
      events.sortableTable().pagination().endButton().scrollIntoView()
        .click();

      // event name should be visible on last page (sorted in DESC order)
      events.sortableTable().rowElementWithPartialName(uniquePod).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of events data
      generateEventsDataSmall();
      events.goTo();
      events.waitForPage();
      cy.wait('@eventsDataSmall');

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, 3);
      events.sortableTable().pagination().checkNotExists();
    });

    after('clean up', () => {
      cy.tableRowsPerPageAndPreferences(100, {
        clusterName:     cluster,
        groupBy:         'none',
        namespaceFilter: '{"local":["all://user"]}',
        allNamespaces:   'false',
      });

      // delete namespace (this will also delete all pods in it)
      cy.deleteRancherResource('v1', 'namespaces', nsName1);
      cy.deleteRancherResource('v1', 'namespaces', nsName2);
    });
  });
});
