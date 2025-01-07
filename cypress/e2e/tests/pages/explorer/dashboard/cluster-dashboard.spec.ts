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
import { eventsNoDataset } from '@/cypress/e2e/blueprints/explorer/cluster/events';

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

    // check if burger menu nav is highlighted correctly for local cluster
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local');
  });

  it('has the correct title', () => {
    ClusterDashboardPagePo.navTo();

    cy.title().should('eq', 'Rancher - local - Cluster Dashboard');
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
    clusterDashboard.customBadge().selectCheckbox('Badge background color').set();
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

    burgerMenu.clusterNotPinnedList().first().find('span').should('contain', settings.iconText);

    // Reset
    clusterDashboard.customizeAppearanceButton().click();
    clusterDashboard.customBadge().selectCheckbox('Use custom badge').set();
    clusterDashboard.customBadge().selectCheckbox('Badge background color').set();
    clusterDashboard.customBadge().selectCheckbox('Show cluster comment').set();

    // Apply Changes
    clusterDashboard.customBadge().applyAndWait('/v3/clusters/local');

    // check header and side nav for update
    header.clusterIcon().children().should('have.class', 'cluster-local-logo');
    header.clusterName().should('contain', 'local');
    header.customBadge().should('not.exist');
    burgerMenu.clusterNotPinnedList().first().find('svg').should('have.class', 'cluster-local-logo');
  });

  it('can view deployments', () => {
    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
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

  let removePod = false;
  let podName = `e2e-test`;
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
        cy.createPod(nsName, podName, 'nginx:latest').then((resp) => {
          podName = resp.body.metadata.name;
          removePod = true;
        });
      });
    });

    clusterDashboard.goTo();
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // Check events
    clusterDashboard.eventsList().resourceTable().sortableTable().rowElements()
      .should('have.length.gte', 2);

    clusterDashboard.fullEventsLink().click();

    const events = new EventsPagePo('local');

    events.waitForPage();
    events.sortableTable().rowElements().should('have.length.gte', 2);
  });

  it('can view events table empty if no events', { tags: ['@vai', '@adminUser'] }, () => {
    eventsNoDataset();
    clusterDashboard.goTo();

    cy.wait('@eventsNoData');
    clusterDashboard.waitForPage(undefined, 'cluster-events');

    clusterDashboard.eventsList().resourceTable().sortableTable().checkRowCount(true, 1);

    let expectedHeaders = ['Reason', 'Object', 'Message', 'Name', 'Date'];

    cy.isVaiCacheEnabled().then((isVaiCacheEnabled) => {
      if (isVaiCacheEnabled) {
        expectedHeaders = ['Reason', 'Object', 'Message', 'Name', 'First Seen', 'Last Seen', 'Count'];
      }

      clusterDashboard.eventsList().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      clusterDashboard.eventsList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      clusterDashboard.fullEventsLink().click();
      cy.wait('@eventsNoData');
      const events = new EventsPagePo('local');

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
  });

  describe('Cluster dashboard with limited permissions', () => {
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
      cy.getRancherResource('v3', 'users?me=true').then((resp: Cypress.Response<any>) => {
        const adminUserId = resp.body.data[0].id.trim();

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
      cy.login();
      cy.deleteRancherResource('v1', 'namespaces', stdNsName);

      cy.get<string>('@standardUserProject').then((projectId) => {
        cy.deleteRancherResource('v3', 'projects', projectId);
      });

      cy.get('@createUserRequest').then((req) => {
        const userId = req.body.id;

        cy.deleteRancherResource('v3', 'users', userId);
      });
    });
  });

  after(function() {
    if (removePod) {
      cy.deleteRancherResource('v1', `pods/${ nsName }`, `${ podName }`);
      cy.deleteRancherResource('v1', 'namespaces', `${ nsName }`);
      cy.deleteRancherResource('v3', 'projects', this.projId);
    }
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
