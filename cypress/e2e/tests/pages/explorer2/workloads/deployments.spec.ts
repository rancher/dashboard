import { WorkloadsDeploymentsListPagePo, WorkloadsDeploymentsCreatePagePo, WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createDeploymentBlueprint, deploymentCreateRequest } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { generateDeploymentsDataSmall } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployments-get';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { createManyWorkloads, deleteManyWorkloadNamespaces, SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';

const localCluster = 'local';

describe('Deployments', { testIsolation: 'off', tags: '@explorer2' }, () => {
  before(() => {
    cy.login();
  });

  describe('CRUD', { tags: ['@standardUser', '@adminUser'] }, () => {
    const deploymentsListPage = new WorkloadsDeploymentsListPagePo(localCluster);
    const deploymentsCreatePage = new WorkloadsDeploymentsCreatePagePo(localCluster);
    const deploymentEditConfigPage = new WorkloadsDeploymentsCreatePagePo();
    const { namespace } = createDeploymentBlueprint.metadata;
    let deploymentId;
    let volumeDeploymentId;

    before(() => {
      cy.createE2EResourceName('deployment').then((name) => {
        deploymentId = name;
      });

      cy.createE2EResourceName('volume-deployment').then((name) => {
        volumeDeploymentId = name;
        // Create a deployment with volumes for the volume-related tests
        const volumeDeployment = { ...createDeploymentBlueprint };

        volumeDeployment.metadata.name = volumeDeploymentId;
        cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(volumeDeployment));
      });

      cy.intercept('POST', '/v1/apps.deployments').as('createDeployment');
    });

    it('should be able to create a new deployment with basic options', () => {
      deploymentCreateRequest.metadata.name = deploymentId;
      const { namespace } = deploymentCreateRequest.metadata;
      const containerImage = 'nginx';

      deploymentsCreatePage.goTo();
      deploymentsCreatePage.waitForPage();

      deploymentsCreatePage.createWithUI(deploymentId, containerImage, namespace);

      cy.wait('@createDeployment').then(({ request, response }) => {
        // comparing pod spec instead of the entire request body to avoid needing to compare labels that include the dynamic test name
        expect(request.body.spec.template.spec).to.deep.eq(deploymentCreateRequest.spec.template.spec);
        expect(response.statusCode).to.eq(201);
        expect(response.body.metadata.name).to.eq(deploymentId);
        expect(response.body.metadata.namespace).to.eq(namespace);
      });
    });

    it('Should be able to scale the number of pods', () => {
      const workloadDetailsPage = new WorkloadsDeploymentsDetailsPagePo(deploymentId);

      workloadDetailsPage.goTo();
      workloadDetailsPage.waitForPage();
      workloadDetailsPage.mastheadTitle().should('contain', deploymentId);
      workloadDetailsPage.podsRunningTotal().should('contain', '1');
      workloadDetailsPage.podScaleUp().click();
      workloadDetailsPage.gaugesPods().should('contain', 'Containercreating');
      workloadDetailsPage.gaugesPods().should('contain', 'Running');
      workloadDetailsPage.podsRunningTotal().should('contain', '2', MEDIUM_TIMEOUT_OPT);
      workloadDetailsPage.podScaleDown().click();
      workloadDetailsPage.podsRunningTotal().should('contain', '1', MEDIUM_TIMEOUT_OPT);
    });

    it('Should be able to view and edit configuration of pod volumes with no custom component', () => {
      cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ volumeDeploymentId }`).as('editDeployment');

      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      deploymentsListPage.goToEditConfigPage(volumeDeploymentId);

      // open the pod tab
      deploymentEditConfigPage.horizontalTabs().clickTabWithSelector('li#pod');

      // open the pod storage tab
      deploymentEditConfigPage.podTabs().clickTabWithSelector('li#storage-pod');

      // check that there is a component rendered for each workload volume and that that component has rendered some information about the volume
      deploymentEditConfigPage.podStorage().nthVolumeComponent(0).yamlEditor().value()
        .should('contain', 'name: test-vol');
      deploymentEditConfigPage.podStorage().nthVolumeComponent(1).yamlEditor().value()
        .should('contain', 'name: test-vol1');

      // now try editing
      deploymentEditConfigPage.podStorage().nthVolumeComponent(0).yamlEditor().set('name: test-vol-changed\nprojected:\n    defaultMode: 420');

      // verify that the list of volumes in the container tab has updated
      deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');
      deploymentEditConfigPage.containerStorage().addVolumeButton().toggle();
      deploymentEditConfigPage.containerStorage().addVolumeButton().getOptions().should('contain', 'test-vol-changed (projected)');
      deploymentEditConfigPage.containerStorage().addVolumeButton().getOptions().should('not.contain', 'test-vol (projected)');

      deploymentEditConfigPage.resourceDetail().cruResource().saveOrCreate().click();

      cy.wait('@editDeployment').then(({ request, response }) => {
        expect(response.statusCode).to.eq(200);
        expect(request.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed', projected: { defaultMode: 420 } });
        expect(response.body.spec.template.spec.volumes[0]).to.deep.eq({ name: 'test-vol-changed', projected: { defaultMode: 420, sources: null } });
      });
    });

    it('should be able to add and remove container volume mounts', () => {
      cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ volumeDeploymentId }`).as('editDeployment');

      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      deploymentsListPage.goToEditConfigPage(volumeDeploymentId);
      deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');

      deploymentEditConfigPage.containerStorage().addVolume('test-vol1');

      deploymentEditConfigPage.containerStorage().nthVolumeMount(0).nthMountPoint(0).set('test-123');

      deploymentEditConfigPage.resourceDetail().cruResource().saveOrCreate().click();

      cy.wait('@editDeployment').then(({ request, response }) => {
        expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
        expect(response.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([{ mountPath: 'test-123', name: 'test-vol1' }]);
      });

      cy.intercept('PUT', `/v1/apps.deployments/${ namespace }/${ volumeDeploymentId }`).as('editDeployment');

      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      deploymentsListPage.goToEditConfigPage(volumeDeploymentId);
      deploymentEditConfigPage.nthContainerTabs(0).clickTabWithSelector('li#storage');
      deploymentEditConfigPage.containerStorage().removeVolume(0);
      deploymentEditConfigPage.resourceDetail().cruResource().saveOrCreate().click();

      cy.wait('@editDeployment').then(({ request, response }) => {
        expect(request.body.spec.template.spec.containers[0].volumeMounts).to.deep.eq([]);
        expect(response.body.spec.template.spec.containers[0].volumeMounts).to.eq(undefined);
      });
    });

    it('should be able to add and remove EnvVars', () => {
      // The viewport needs to be a little larger for cypress to consider the key value input components to be visible
      cy.viewport(1440, 900);

      deploymentsCreatePage.goTo();
      deploymentsCreatePage.waitForPage();

      deploymentsCreatePage.horizontalTabs().clickTabWithSelector('li#container-0');

      deploymentsCreatePage.addEnvironmentVariable();
      deploymentsCreatePage.addEnvironmentVariable();
      deploymentsCreatePage.addEnvironmentVariable();

      // Ensure the default key and value are empty as expected
      deploymentsCreatePage.environmentVariableKeyInput(0).value().should('eq', '');
      deploymentsCreatePage.environmentVariableValueInput(0).value().should('eq', '');

      deploymentsCreatePage.environmentVariableKeyInput(0).set('a');
      deploymentsCreatePage.environmentVariableValueInput(0).set('a');
      deploymentsCreatePage.environmentVariableKeyInput(1).set('b');
      deploymentsCreatePage.environmentVariableValueInput(1).set('b');
      deploymentsCreatePage.environmentVariableKeyInput(2).set('c');
      deploymentsCreatePage.environmentVariableValueInput(2).set('c');

      // Ensure when we remove the variable we remove the correct row
      deploymentsCreatePage.removeEnvironmentVariable(1);
      deploymentEditConfigPage.environmentVariableKeyInput(1).value().should('eq', 'c');
    });

    it('should be able to select Pod CSI storage option', () => {
      deploymentsCreatePage.goTo();
      deploymentsCreatePage.waitForPage();

      // open the pod tab
      deploymentsCreatePage.horizontalTabs().clickTabWithSelector('li#pod');

      // open the pod storage tab
      deploymentsCreatePage.podTabs().clickTabWithSelector('li#storage-pod');

      deploymentsCreatePage.podStorage().addVolumeButton().toggle();
      deploymentsCreatePage.podStorage().addVolumeButton().getOptions().should('contain', 'CSI');

      deploymentsCreatePage.podStorage().addVolumeButton().clickOptionWithLabel('CSI');

      // open the driver input
      deploymentsCreatePage.podStorage().driverInput().toggle();
      deploymentsCreatePage.podStorage().driverInput().getOptions().should('contain', 'Longhorn');

      // select the Longhorn option from the driver input
      deploymentsCreatePage.podStorage().driverInput().clickOptionWithLabel('Longhorn');
    });

    it('Should be able to delete the workload', () => {
      deploymentsListPage.goTo();
      deploymentsListPage.waitForPage();
      deploymentsListPage.listElementWithName(deploymentId).should('exist');
      deploymentsListPage.deleteAndWaitForRequest(deploymentId);
      deploymentsListPage.listElementWithName(deploymentId).should('not.exist');
    });

    after(() => {
      cy.deleteRancherResource('v1', 'apps.deployment', `${ namespace }/${ volumeDeploymentId }`);
    });
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    const deploymentsListPage = new WorkloadsDeploymentsListPagePo(localCluster);

    let uniqueDeployment = SortableTablePo.firstByDefaultName('deployment');
    let deploymentNamesList = [];
    let nsName1: string;
    let nsName2: string;
    let rootResourceName: string;

    before('set up', () => {
      cy.getRootE2EResourceName().then((root) => {
        rootResourceName = root;
      });

      const createDeployment = (deploymentName?: string) => {
        return ({ ns, i }: {ns: string, i: number}) => {
          const name = deploymentName || Cypress._.uniqueId(`${ Date.now().toString() }-${ i }`);

          return cy.createRancherResource('v1', 'apps.deployment', JSON.stringify({
            apiVersion: 'apps/v1',
            kind:       'Deployment',
            metadata:   {
              name,
              namespace: ns
            },
            spec: {
              replicas: 1,
              selector: { matchLabels: { app: name } },
              template: {
                metadata: { labels: { app: name } },
                spec:     { containers: [SMALL_CONTAINER] }
              }
            }
          }));
        };
      };

      createManyWorkloads({
        context:        'ns1',
        createWorkload: createDeployment(),
      })
        .then(({ ns, workloadNames }) => {
          deploymentNamesList = workloadNames;
          nsName1 = ns;
        })
        .then(() => createManyWorkloads({
          context:        'ns2',
          createWorkload: createDeployment(uniqueDeployment),
          count:          1
        }))
        .then(({ ns, workloadNames }) => {
          uniqueDeployment = workloadNames[0];
          nsName2 = ns;

          cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', `{\"local\":[\"ns://${ nsName1 }\",\"ns://${ nsName2 }\"]}`);
        });
    });

    it('pagination is visible and user is able to navigate through deployments data', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(localCluster, { nsProject: { values: [nsName1, nsName2] } });

      WorkloadsDeploymentsListPagePo.navTo();
      deploymentsListPage.waitForPage();

      // check deployments count
      const count = deploymentNamesList.length + 1;

      cy.waitForRancherResources('v1', 'apps.deployment', count - 1, true).then((resp: Cypress.Response<any>) => {
      // pagination is visible
        deploymentsListPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        deploymentsListPage.sortableTable().pagination().beginningButton().isDisabled();
        deploymentsListPage.sortableTable().pagination().leftButton().isDisabled();
        deploymentsListPage.sortableTable().pagination().rightButton().isEnabled();
        deploymentsListPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        deploymentsListPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Deployments`);
        });

        // navigate to next page - right button
        deploymentsListPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        deploymentsListPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`11 - 20 of ${ count } Deployments`);
        });
        deploymentsListPage.sortableTable().pagination().beginningButton().isEnabled();
        deploymentsListPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        deploymentsListPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        deploymentsListPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Deployments`);
        });
        deploymentsListPage.sortableTable().pagination().beginningButton().isDisabled();
        deploymentsListPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        deploymentsListPage.sortableTable().pagination().endButton().scrollIntoView()
          .click();

        // row count on last page
        let lastPageCount = count % 10;

        if (lastPageCount === 0) {
          lastPageCount = 10;
        }

        // check text after navigation
        deploymentsListPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`${ count - (lastPageCount) + 1 } - ${ count } of ${ count } Deployments`);
        });

        // navigate to first page - beginning button
        deploymentsListPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        deploymentsListPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 10 of ${ count } Deployments`);
        });
        deploymentsListPage.sortableTable().pagination().beginningButton().isDisabled();
        deploymentsListPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('sorting changes the order of paginated deployments data', () => {
      WorkloadsDeploymentsListPagePo.navTo();
      deploymentsListPage.waitForPage();
      // use filter to only show test data
      deploymentsListPage.sortableTable().filter(rootResourceName);

      // check table is sorted by name in ASC order by default
      deploymentsListPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // deployment name should be visible on first page (sorted in ASC order)
      deploymentsListPage.sortableTable().tableHeaderRow().self().scrollIntoView();
      deploymentsListPage.sortableTable().rowElementWithName(deploymentNamesList[0]).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      deploymentsListPage.sortableTable().sort(2).click({ force: true });
      deploymentsListPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'up');

      // deployment name should be NOT visible on first page (sorted in DESC order)
      deploymentsListPage.sortableTable().rowElementWithName(deploymentNamesList[0]).should('not.exist');

      // navigate to last page
      deploymentsListPage.sortableTable().pagination().endButton().scrollIntoView()
        .click();

      // deployment name should be visible on last page (sorted in DESC order)
      deploymentsListPage.sortableTable().rowElementWithName(deploymentNamesList[0]).scrollIntoView().should('be.visible');
    });

    it('filter deployments', () => {
      WorkloadsDeploymentsListPagePo.navTo();
      deploymentsListPage.waitForPage();

      deploymentsListPage.sortableTable().checkVisible();
      deploymentsListPage.sortableTable().checkLoadingIndicatorNotVisible();
      deploymentsListPage.sortableTable().checkRowCount(false, 10);

      // filter by name
      deploymentsListPage.sortableTable().filter(deploymentNamesList[0]);
      deploymentsListPage.sortableTable().checkRowCount(false, 1);
      deploymentsListPage.sortableTable().rowElementWithName(deploymentNamesList[0]).should('be.visible');

      // filter by namespace
      deploymentsListPage.sortableTable().filter(nsName2);
      deploymentsListPage.sortableTable().checkRowCount(false, 1);
      deploymentsListPage.sortableTable().rowElementWithName(uniqueDeployment).should('be.visible');
    });

    it('pagination is hidden', () => {
      cy.tableRowsPerPageAndNamespaceFilter(10, localCluster, 'none', '{"local":[]}');

      // generate small set of deployments data
      generateDeploymentsDataSmall();
      HomePagePo.goTo(); // this is needed here for the intercept to work
      WorkloadsDeploymentsListPagePo.navTo();
      cy.wait('@deploymentsDataSmall');
      deploymentsListPage.waitForPage();

      deploymentsListPage.sortableTable().checkVisible();
      deploymentsListPage.sortableTable().checkLoadingIndicatorNotVisible();
      deploymentsListPage.sortableTable().checkRowCount(false, 1);
      deploymentsListPage.sortableTable().pagination().checkNotExists();
    });

    after('clean up', () => {
    // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all deployments in it)
      deleteManyWorkloadNamespaces([nsName1, nsName2]);
    });
  });
});
