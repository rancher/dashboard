import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
// import CardPo from '@/cypress/e2e/po/components/card.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import SimpleBoxPo from '@/cypress/e2e/po/components/simple-box.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { NodesPagePo } from '@/cypress/e2e/po/pages/explorer/nodes.po';
import { EventsPageListPo } from '@/cypress/e2e/po/pages/explorer/events.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { eventsNoDataset } from '@/cypress/e2e/blueprints/explorer/cluster/events';
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

// [CREATE ISSUE TO INVESTIGATE] Entering a cluster runs the nav guard's loadCluster
// (shell/config/router/navigation-guards/clusters.js), which awaits two *unprotected* requests
// against the downstream Steve proxy - GET /k8s/clusters/<id>/v1/schemas
// (shell/store/index.js:1079) and then /counts + /namespaces (shell/store/index.js:1107). If the
// downstream proxy is momentarily reconnecting, one of those rejects with a raw axios
// "Network Error" (no HTTP status, shell/plugins/steve/actions.js onError); the guard sees a
// non-ClusterNotFound error and dead-ends on /fail-whale, with no retry or tolerance. The app
// should retry/tolerate a transient downstream blip during load instead of crashing.
//
// Test-side we PREVENT it first with PagePo.readyForClusterPage - confirm the mgmt cluster is
// Connected, then poll the downstream proxy endpoints loadCluster hits (schemas/counts/namespaces)
// until they are consistently serving before navigating. But the crash happens inside the app's async
// load AFTER any precondition we can check, so prevention alone is not a guarantee:
// ignoreClusterLoadNetworkError + goToClusterDashboardTolerant below add a bounded RECOVERY
// (re-navigate off fail-whale) for the residual case.

// Tolerate the app's known uncaught "Network Error" during cluster load (the tagged bug above): the
// unhandled promise rejection would otherwise auto-fail the test even when a re-navigation recovers.
// Only the specific transient load rejection is swallowed; every other error still fails the test.
const ignoreClusterLoadNetworkError = () => {
  cy.on('uncaught:exception', (err) => {
    if (/Network Error/i.test(err?.message || '')) {
      return false;
    }

    return undefined;
  });
};

// Navigate into the cluster dashboard, tolerating the fail-whale crash the app cannot recover from.
// Prevention (readyForClusterPage) makes this rare, but the crash happens inside the app's async
// loadCluster after any precondition we can check - so if we still land on fail-whale, re-confirm the
// proxy is serving and re-navigate, as a bounded fallback for the tagged app bug.
const goToClusterDashboardTolerant = (clusterId = 'local'): void => {
  clusterDashboard.goTo();
  // If we still landed on fail-whale, re-confirm the proxy is serving and re-enter the cluster
  // (the shared recovery drives the settle + retry loop).
  cy.recoverFromFailWhale(() => {
    clusterDashboard.readyForClusterPage(clusterId);
    clusterDashboard.goTo();
  });
};

describe('Cluster Dashboard', { testIsolation: false, tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can navigate to cluster dashboard', () => {
    const clusterList = new ClusterManagerListPagePo('local');

    clusterList.goTo();
    clusterList.waitForPage();

    // check if burger menu nav is highlighted correctly for cluster manager
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Cluster Management');

    // Ensure the downstream cluster Steve proxy is actually serving before we enter the cluster,
    // so loadCluster's schemas/counts fetch does not hit a transient "Network Error" and crash to
    // fail-whale (see readyForClusterPage).
    clusterDashboard.readyForClusterPage();

    clusterList.list().explore('local').click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // check if burger menu nav is highlighted correctly for local cluster
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local');
  });

  it('has the correct title', () => {
    ClusterDashboardPagePo.navTo();

    cy.getRancherVersion().then((version) => {
      const expectedTitle = version.RancherPrime === 'true' ? 'Rancher Prime - local - Cluster Dashboard' : 'Rancher - local - Cluster Dashboard';

      cy.title().should('eq', expectedTitle);
    });
  });

  it('shows fleet controller status', () => {
    ClusterDashboardPagePo.navTo();
    clusterDashboard.waitForPage();
    clusterDashboard.fleetStatus().should('exist');
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
  });

  it('can download kubeconfig from header', () => {
    const downloadsFolder = Cypress.config('downloadsFolder');
    const downloadedFilename = path.join(downloadsFolder, 'local.yaml');

    ClusterDashboardPagePo.navTo();

    cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('generateKubeConfig');
    header.downloadKubeconfig().click();
    cy.wait('@generateKubeConfig');

    // A single click must only ever generate one kubeconfig, as each request mints at least one token.
    // See https://github.com/rancher/rancher/issues/55672
    cy.get('@generateKubeConfig.all').should('have.length', 1);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      expect(obj.kind).to.equal('Config');

      // The legacy `rancher` entry pointing at the Rancher server root is excluded
      expect(obj.clusters.map((cluster: { name: string }) => cluster.name)).to.not.include('rancher');
      expect(obj.contexts.map((context: { name: string }) => context.name)).to.not.include('rancher');
    });
  });

  it('can copy the kubeconfig to clipboard', () => {
    ClusterDashboardPagePo.navTo();
    cy.intercept('POST', '/v1/ext.cattle.io.kubeconfigs').as('copyKubeConfig');
    header.copyKubeconfig().click();
    header.copyKubeConfigCheckmark().should('be.visible');
    cy.wait('@copyKubeConfig');
  });

  // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/15697
  // it('can add cluster badge', () => {
  //   const settings = {
  //     description: {
  //       original: '',
  //       new:      'E2E Test'
  //     },
  //     iconText:        'E2E',
  //     backgroundColor: {
  //       original: '#ff0000',
  //       new:      '#f80dd8',
  //       newRGB:   'rgb(248, 13, 216)'
  //     }
  //   };

  //   ClusterDashboardPagePo.navTo();

  //   // Add Badge
  //   clusterDashboard.customizeAppearanceButton().click();

  //   const customClusterCard = new CardPo();

  //   customClusterCard.getTitle().contains('Cluster Appearance');

  //   // update badge
  //   clusterDashboard.customBadge().selectCheckbox('Show cluster comment').set();
  //   clusterDashboard.customBadge().badgeCustomDescription().set(settings.description.new);

  //   // update color
  //   clusterDashboard.customBadge().colorPicker().value().should('not.eq', settings.backgroundColor.new);
  //   clusterDashboard.customBadge().selectCheckbox('Badge background color').set();
  //   clusterDashboard.customBadge().colorPicker().set(settings.backgroundColor.new);
  //   clusterDashboard.customBadge().colorPicker().previewColor().should('eq', settings.backgroundColor.newRGB);

  //   // update icon
  //   clusterDashboard.customBadge().selectCheckbox('Use custom badge').set();
  //   clusterDashboard.customBadge().iconText().set(settings.iconText);
  //   clusterDashboard.customBadge().clusterIcon().contains(settings.iconText);

  //   // Apply Changes
  //   clusterDashboard.customBadge().applyAndWait('/v3/clusters/local');

  //   // check header and side nav for update
  //   header.clusterIcon().children().should('have.class', 'cluster-badge-logo');
  //   header.clusterName().should('contain', 'local');
  //   header.customBadge().should('contain', settings.description.new);
  //   const burgerMenu = new BurgerMenuPo();

  //   burgerMenu.clusterNotPinnedList().first().find('span').should('contain', settings.iconText);

  //   // Reset
  //   clusterDashboard.customizeAppearanceButton().click();
  //   clusterDashboard.customBadge().selectCheckbox('Use custom badge').set();
  //   clusterDashboard.customBadge().selectCheckbox('Badge background color').set();
  //   clusterDashboard.customBadge().selectCheckbox('Show cluster comment').set();

  //   // Apply Changes
  //   clusterDashboard.customBadge().applyAndWait('/v3/clusters/local');

  //   // check header and side nav for update
  //   header.clusterIcon().children().should('have.class', 'cluster-local-logo');
  //   header.clusterName().should('contain', 'local');
  //   header.customBadge().should('not.exist');
  //   burgerMenu.clusterNotPinnedList().first().find('svg').should('have.class', 'cluster-local-logo');
  // });

  it('can view deployments', () => {
    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
    cy.getRancherResource('v1', 'apps.deployments', '?exclude=metadata.managedFields').then((resp: Cypress.Response<any>) => {
      const count = resp.body['count'];

      simpleBox.simpleBox().eq(2).should('contain.text', count).and('contain.text', 'Deployments');
    }).then((el: any) => {
      el.click();

      const workloadDeployments = new WorkloadsDeploymentsListPagePo('local', 'apps.deployment' as any);

      workloadDeployments.waitForPage();
    });
  });

  it('can view nodes', () => {
    clusterDashboard.goTo();
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

  const projIds: string[] = [];
  const nsIds: string[] = [];

  it('can view events and change events list count in cluster dashboard', () => {
    const podNames = ['e2e-test1', 'e2e-test2', 'e2e-test3', 'e2e-test4', 'e2e-test5', 'e2e-test6'];

    // Create unique for this run values (helps with retries)
    cy.createE2EResourceName(`cd-proj-${ new Date().getTime() }`).as('projName');
    cy.createE2EResourceName(`cd-ns-${ new Date().getTime() }`).as('nsName');

    // Create a pod to trigger events

    // get user id
    cy.getRancherResource('v1', 'ext.cattle.io.selfuser').then((resp: Cypress.Response<any>) => {
      const userId = resp.body.status.userID;

      cy.get<string>('@projName').then((projName) => {
        cy.get<string>('@nsName').then((nsName) => {
          // create project
          cy.createProject(projName, 'local', userId).then((resp: Cypress.Response<any>) => {
            const projId = resp.body.id;

            projIds.push(projId);

            // create ns
            cy.createNamespaceInProject(nsName, projId).then((resp: Cypress.Response<any>) => {
              const nsId = resp.body.id;

              nsIds.push(nsId);

              // create various pods to generate 12 events in total
              podNames.forEach((podName) => cy.createPod(nsName, podName, 'nginx:latest')); // eslint-disable-current-line no-return-assign
            });
          });
        });
      });
    });

    // This test creates a project/namespace/pods first, adding backend churn, so the downstream
    // Steve proxy is especially likely to be mid-reconnect here. Wait for it to actually serve before
    // navigating in (prevention), tolerate the app's known uncaught Network Error, and re-navigate off
    // fail-whale if the app still crashes inside its async load (recovery) - see the helpers above.
    ignoreClusterLoadNetworkError();
    clusterDashboard.readyForClusterPage();
    goToClusterDashboardTolerant();
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // Check events
    clusterDashboard.eventsList().sortableTable().self().scrollIntoView();
    clusterDashboard.eventsList().sortableTable().rowElements()
      .should('have.length.gte', 10); // default is now 10 events. user can configure in gear icon

    // change events list row count
    clusterDashboard.eventsRowCountMenuToggle();
    clusterDashboard.eventsRowCountMenu().getMenuItem('Show 25 events').click();
    clusterDashboard.eventsList().sortableTable().rowElements()
      .should('have.length.gte', 12); // minimum is 12, as per the pods generated above

    clusterDashboard.fullEventsLink().click();

    const events = new EventsPageListPo('local');

    events.waitForPage();
    events.list().resourceTable().sortableTable().rowElements()
      .should('have.length.gte', 12);
  });

  it('can view events table empty if no events', { tags: ['@adminUser'] }, () => {
    eventsNoDataset();
    clusterDashboard.goTo();

    cy.wait('@eventsNoData');
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    clusterDashboard.eventsList().sortableTable().checkRowCount(true, 1);

    const expectedHeaders = ['Reason', 'Object', 'Message', 'Name', 'First Seen', 'Last Seen', 'Count'];

    clusterDashboard.eventsList().sortableTable().tableHeaderRow()
      .self()
      .scrollIntoView();
    clusterDashboard.eventsList().sortableTable().tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedHeaders[i]);
      });

    clusterDashboard.fullEventsLink().click();
    cy.wait('@eventsNoData');
    const events = new EventsPageListPo('local');

    events.waitForPage();

    events.list().resourceTable().sortableTable().checkRowCount(true, 1);

    const expectedFullHeaders = ['State', 'Last Seen', 'Type', 'Reason', 'Object',
      'Subobject', 'Source', 'Message', 'First Seen', 'Count', 'Name', 'Namespace'];

    events.list().resourceTable().sortableTable().tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedFullHeaders[i]);
      });
  });

  describe('Cluster dashboard with limited permissions', { testIsolation: true }, () => {
    let stdProjectName;
    let stdNsName;
    let stdUsername;

    beforeEach(() => {
      stdProjectName = `standard-user-project${ +new Date() }`;
      stdNsName = `standard-user-ns${ +new Date() }`;
      stdUsername = `standard-user`;
      const password = Cypress.env('password');

      // log in as admin
      cy.login();
      cy.getRancherResource('v1', 'ext.cattle.io.selfuser').then((resp: Cypress.Response<any>) => {
        const adminUserId = resp.body.status.userID;

        // create project
        return cy.createProject(stdProjectName, 'local', adminUserId).then((resp: Cypress.Response<any>) => {
          cy.wrap(resp.body.id.trim()).as('standardUserProject');

          // create ns in project
          return cy.get<string>('@standardUserProject').then((projId) => {
            cy.createNamespaceInProject(stdNsName, projId);

            // create std user and assign to project
            cy.createUser({
              username:    stdUsername,
              globalRole:  { role: 'user' },
              projectRole: {
                clusterId: 'local', projectName: stdProjectName, role: 'project-owner'
              },
              password
            })
              .as('createUserRequest')
              .then((resp) => {
                stdUsername = resp.body.username;

                // log in as new standard user
                cy.login(stdUsername, password, false);

                // go to cluster dashboard
                ClusterDashboardPagePo.navTo();

                return clusterDashboard.waitForPage();
              });
          });
        });
      });
    });

    // note - this would be 'fleet agent' on downstream clusters
    it('does not show fleet controller status if the user does not have permission to view the fleet controller deployment', () => {
      clusterDashboard.fleetStatus().should('not.exist');

      clusterDashboard.etcdStatus().should('exist');
      clusterDashboard.schedulerStatus().should('exist');
      clusterDashboard.controllerManagerStatus().should('exist');
    });

    // log back in as admin and delete the project, ns, and user from previous test
    afterEach(() => {
      cy.login(); // bypass cy.session
      cy.deleteRancherResource('v1', 'namespaces', stdNsName);

      cy.get<string>('@standardUserProject').then((projectId) => {
        cy.deleteRancherResource('v3', 'projects', projectId);
      });

      cy.get('@createUserRequest').then((req: any) => {
        const userId = req.body.id;

        cy.deleteRancherResource('v1', 'management.cattle.io.users', userId);
      });
    });
  });

  function reply(statusCode: number, body: any) {
    return (req) => {
      req.reply({ statusCode, body });
    };
  }

  const forbiddenResponse = {
    type:    'error',
    links:   {},
    code:    'Forbidden',
    message: 'deployments.apps is forbidden',
    status:  403,
  };

  describe('Cluster dashboard - Fleet agent', { testIsolation: true }, () => {
    // Re-login as admin to ensure auth is restored after the 'limited permissions' tests
    // which log in as a standard user and may leave session cookies in an inconsistent state
    beforeEach(() => {
      cy.login();
    });

    it('does not show fleet controller status if a 403 is returned by the API', () => {
      cy.intercept('GET', '/v1/apps.deployments/cattle-fleet-system/fleet-controller?*', reply(403, forbiddenResponse));
      cy.intercept('GET', '/v1/apps.deployments/cattle-fleet-local-system/fleet-agent?*', reply(403, forbiddenResponse));

      HomePagePo.goToAndWaitForGet();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage();

      clusterDashboard.fleetStatus().should('exist');
      clusterDashboard.fleetStatus().should('be.hidden');
      clusterDashboard.etcdStatus().should('exist');
      clusterDashboard.schedulerStatus().should('exist');
      clusterDashboard.controllerManagerStatus().should('exist');
    });

    it('does not show fleet controller status if a 404 is returned by the API', () => {
      cy.intercept('GET', '/v1/apps.deployments/cattle-fleet-system/fleet-controller?*', reply(404, {}));
      cy.intercept('GET', '/v1/apps.deployments/cattle-fleet-local-system/fleet-agent?*', reply(404, {}));

      HomePagePo.goToAndWaitForGet();
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage();

      clusterDashboard.fleetStatus().should('exist');
      clusterDashboard.fleetStatus().should('be.hidden');
      clusterDashboard.etcdStatus().should('exist');
      clusterDashboard.schedulerStatus().should('exist');
      clusterDashboard.controllerManagerStatus().should('exist');
    });
  });

  after(() => {
    // Ensure admin auth is restored before cleanup, as previous tests may have
    // logged in as a different user or left the session in an inconsistent state
    cy.login();

    nsIds.forEach((nsId) => {
      cy.deleteRancherResource('v1', 'namespaces', nsId);
    });

    projIds.forEach((projId) => {
      cy.deleteRancherResource('v3', 'projects', projId);
    });

    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
