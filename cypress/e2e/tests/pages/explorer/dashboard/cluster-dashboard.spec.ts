import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import SimpleBoxPo from '@/cypress/e2e/po/components/simple-box.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { NodesPagePo } from '@/cypress/e2e/po/pages/explorer/nodes.po';
import { EventsPagePo } from '@/cypress/e2e/po/pages/explorer/events.po';
import * as path from 'path';
import { generateEventsDataLarge, generateEventsDataSmall, eventsNoDataset } from '@/cypress/e2e/blueprints/explorer/cluster/events';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const configMapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: e2e-test-${ +new Date() }
  annotations:
    {}
    #  key: string
  labels:
    {}
    #  key: string
  namespace: default
__clone: true
#binaryData:  key: string
#data:  key: string
#immutable: boolean`;

const clusterDashboard = new ClusterDashboardPagePo('local');
const simpleBox = new SimpleBoxPo();
const header = new HeaderPo();

describe('Cluster Dashboard', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  const podName = `e2e-test-${ +new Date() }`;

  before(() => {
    cy.login();
  });

  it('can navigate to cluster dashboard', () => {
    const clusterList = new ClusterManagerListPagePo('local');

    clusterList.goTo();
    clusterList.waitForPage();

    // check if burguer menu nav is highlighted correctly for cluster manager
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Cluster Management');

    clusterList.list().explore('local').click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // check if burguer menu nav is highlighted correctly for local cluster
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local');
  });

  it('has the correct title', () => {
    ClusterDashboardPagePo.goTo('local');

    cy.title().should('eq', 'Rancher - local - Cluster Dashboard');
  });

  it('can import a YAML successfully, using the header action "Import YAML"', () => {
    ClusterDashboardPagePo.navTo();

    header.importYamlHeaderAction().click();
    header.importYaml().importYamlEditor().set(configMapYaml);
    header.importYaml().importYamlImportClick();

    // we need to wait for the async action to finish in order to do further assertions
    header.importYaml().importYamlSuccessTitleCheck();

    // testing https://github.com/rancher/dashboard/issues/10656
    header.importYaml().importYamlSortableTable().tableHeaderRowElementWithPartialName('State').should('not.exist');
    header.importYaml().importYamlSortableTable().subRows().should('not.exist');

    header.importYaml().importYamlCloseClick();
  });

  it('can open the kubectl shell from header', () => {
    ClusterDashboardPagePo.navTo();

    header.kubectlShell().openAndExecuteCommand('get no');
    header.kubectlShell().closeTerminal();
    header.kubectlShell().checkNotVisible();
  });

  it('can download kubeconfig from header', () => {
    const downloadsFolder = Cypress.config('downloadsFolder');
    const downloadedFilename = path.join(downloadsFolder, 'local.yaml');

    ClusterDashboardPagePo.navTo();

    header.downloadKubeconfig().click();
    cy.readFile(downloadedFilename).should('contain', 'kind: Config');
  });

  it('can copy the kubeconfig to clipboard', () => {
    ClusterDashboardPagePo.navTo();
    cy.intercept('POST', '*action=generateKubeconfig').as('copyKubeConfig');
    header.copyKubeconfig().click();
    header.copyKubeConfigCheckmark().should('be.visible');
    cy.wait('@copyKubeConfig');
  });

  it('can add cluster badge', () => {
    const settings = {
      description: {
        original: '',
        new:      'E2E Test'
      },
      iconText:        'E2E',
      backgroundColor: {
        original: '#ff0000',
        new:      '#f80dd8',
        newRGB:   'rgb(248, 13, 216)'
      }
    };

    ClusterDashboardPagePo.navTo();

    // Add Badge
    clusterDashboard.customizeAppearanceButton().click();

    const customClusterCard = new CardPo();

    customClusterCard.getTitle().contains('Cluster Appearance');

    // update badge
    clusterDashboard.customBadge().selectCheckbox('Show cluster comment').set();
    clusterDashboard.customBadge().badgeCustomDescription().set(settings.description.new);

    // update color
    clusterDashboard.customBadge().colorPicker().value().should('not.eq', settings.backgroundColor.new);
    clusterDashboard.customBadge().colorPicker().set(settings.backgroundColor.new);
    clusterDashboard.customBadge().colorPicker().previewColor().should('eq', settings.backgroundColor.newRGB);

    // update icon
    clusterDashboard.customBadge().selectCheckbox('Use custom badge').set();
    clusterDashboard.customBadge().iconText().set(settings.iconText);
    clusterDashboard.customBadge().clusterIcon().contains(settings.iconText);

    // Apply Changes
    clusterDashboard.customBadge().applyAndWait('/v3/clusters/local');

    // check header and side nav for update
    header.clusterIcon().children().should('have.class', 'cluster-badge-logo');
    header.clusterName().should('contain', 'local');
    header.customBadge().should('contain', settings.description.new);
    const burgerMenu = new BurgerMenuPo();

    burgerMenu.clusters().first().find('span').should('contain', settings.iconText);

    // Reset
    clusterDashboard.customizeAppearanceButton().click();
    clusterDashboard.customBadge().selectCheckbox('Use custom badge').set();
    clusterDashboard.customBadge().selectCheckbox('Show cluster comment').set();

    // Apply Changes
    clusterDashboard.customBadge().applyAndWait('/v3/clusters/local');

    // check header and side nav for update
    header.clusterIcon().children().should('have.class', 'cluster-local-logo');
    header.clusterName().should('contain', 'local');
    header.customBadge().should('not.exist');
    burgerMenu.clusters().first().find('svg').should('have.class', 'cluster-local-logo');
  });

  it('can view deployments', () => {
    ClusterDashboardPagePo.navTo();
    cy.getRancherResource('v1', 'apps.deployments', '?exclude=metadata.managedFields').then((resp: Cypress.Response<any>) => {
      const count = resp.body['count'];

      simpleBox.simpleBox().eq(2).should('contain.text', count).and('contain.text', 'Deployments');
    }).then((el: any) => {
      el.click();

      const workloadDeployments = new WorkloadsDeploymentsListPagePo('local', 'apps.deployment');

      workloadDeployments.waitForPage();
    });
  });

  it('can view nodes', () => {
    ClusterDashboardPagePo.navTo();
    clusterDashboard.waitForPage();

    cy.getRancherResource('v1', 'nodes', '?exclude=metadata.managedFields').then((resp: Cypress.Response<any>) => {
      const count = resp.body['count'];
      let text = '';

      if (count > 1) {
        text = 'Nodes';
      } else {
        text = 'Node';
      }
      simpleBox.simpleBox().eq(1).should('contain.text', count).and('contain.text', text);
    }).then((el: any) => {
      el.click();

      const nodesPage = new NodesPagePo('local');

      nodesPage.waitForPage();
    });
  });

  let removePod = false;
  const projName = `project${ +new Date() }`;
  const nsName = `namespace${ +new Date() }`;

  it('can view events', () => {
    // Create a pod to trigger events

    // get user id
    cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.data[0].id.trim();

      // create project
      cy.createProject(projName, 'local', userId).then((resp: Cypress.Response<any>) => {
        cy.wrap(resp.body.id.trim()).as('projId');

        // create ns
        cy.get<string>('@projId').then((projId) => {
          cy.createNamespaceInProject(nsName, projId);
        });

        // create pod
        // eslint-disable-next-line no-return-assign
        cy.createPod(nsName, podName, 'nginx:latest').then(() => removePod = true);
      });
    });

    ClusterDashboardPagePo.navTo();
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // Check events
    clusterDashboard.eventsList().resourceTable().sortableTable().rowElements()
      .should('have.length.gte', 2);

    clusterDashboard.fullEventsLink().click();

    const events = new EventsPagePo('local');

    events.waitForPage();
    events.sortableTable().rowElements().should('have.length.gte', 2);
  });

  describe('List', { tags: ['@vai'] }, () => {
    const events = new EventsPagePo('local');
    const eventName = 'aaa-e2e-vai-test-event-name';

    before('set up', () => {
      // set user preferences: update resource filter
      cy.updateResourceListViewPref('local', 'none', '{\"local\":[]}');
      HomePagePo.goTo(); // this is needed for updated user preferences to load in the UI
    });

    it('pagination is visible and user is able navigate through events data', () => {
      // generate large set of events data
      generateEventsDataLarge();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      cy.wait('@eventsDataLarge');
      events.waitForPage();

      // pagination is visible
      events.sortableTable().pagination().checkVisible();

      // basic checks on navigation buttons
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();
      events.sortableTable().pagination().rightButton().isEnabled();
      events.sortableTable().pagination().endButton().isEnabled();

      // check text before navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq('1 - 100 of 125 Events');
      });

      // navigate to next page - right button
      events.sortableTable().pagination().rightButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq('101 - 125 of 125 Events');
      });
      events.sortableTable().pagination().beginningButton().isEnabled();
      events.sortableTable().pagination().leftButton().isEnabled();

      // navigate to first page - left button
      events.sortableTable().pagination().leftButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq('1 - 100 of 125 Events');
      });
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();

      // navigate to last page - end button
      events.sortableTable().pagination().endButton().click();

      // check text after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq('101 - 125 of 125 Events');
      });

      // navigate to first page - beginning button
      events.sortableTable().pagination().beginningButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq('1 - 100 of 125 Events');
      });
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();
    });

    it('filter events', () => {
      // generate large set of events data
      generateEventsDataLarge();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      cy.wait('@eventsDataLarge');
      events.waitForPage();

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, 100);

      // filter by name
      events.sortableTable().filter(eventName);
      events.sortableTable().checkRowCount(false, 1);
      events.sortableTable().rowElementWithName(eventName).scrollIntoView().should('be.visible');
    });

    it('sorting changes the order of paginated events data', () => {
      // generate large set of events data
      generateEventsDataLarge();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();
      cy.wait('@eventsDataLarge');

      // check table is sorted by `last seen` in ASC order by default
      events.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // sort by name in ASC order
      events.sortableTable().sort(11).click();

      // event name should be visible on first page (sorted in ASC order)
      events.sortableTable().rowElementWithName(eventName).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      events.sortableTable().sort(11).click();

      // event name should be NOT visible on first page (sorted in DESC order)
      events.sortableTable().rowElementWithName(eventName).should('not.exist');

      // navigate to last page
      events.sortableTable().pagination().endButton().click();

      // event name should be visible on last page (sorted in DESC order)
      events.sortableTable().rowElementWithName(eventName).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of events data
      generateEventsDataSmall();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();
      cy.wait('@eventsDataSmall');

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, 3);
      events.sortableTable().pagination().checkNotExists();
    });
  });

  it('can view events table empty if no events', { tags: ['@vai'] }, () => {
    const events = new EventsPagePo('local');

    HomePagePo.goTo();

    eventsNoDataset();
    ClusterDashboardPagePo.navTo();
    cy.wait('@eventsNoData');
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    clusterDashboard.eventsList().resourceTable().sortableTable().checkRowCount(true, 1);

    const expectedHeaders = ['Reason', 'Object', 'Message', 'Name', 'Date'];

    clusterDashboard.eventsList().resourceTable().sortableTable().tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedHeaders[i]);
      });

    clusterDashboard.fullEventsLink().click();
    cy.wait('@eventsNoData');
    events.waitForPage();

    events.eventslist().resourceTable().sortableTable().checkRowCount(true, 1);

    const expectedFullHeaders = ['State', 'Last Seen', 'Type', 'Reason', 'Object',
      'Subobject', 'Source', 'Message', 'First Seen', 'Count', 'Name', 'Namespace'];

    events.eventslist().resourceTable().sortableTable().tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedFullHeaders[i]);
      });
  });

  after(function() {
    if (removePod) {
      cy.deleteRancherResource('v1', `pods/${ nsName }`, `pod-${ podName }`);
      cy.deleteRancherResource('v1', 'namespaces', `${ nsName }`);
      cy.deleteRancherResource('v3', 'projects', this.projId);
    }
    cy.updateResourceListViewPref('local', 'none', '{"local":["all://user"]}');
  });
});
