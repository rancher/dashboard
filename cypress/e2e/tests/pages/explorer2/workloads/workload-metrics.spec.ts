import { WorkloadsDeploymentsDetailsPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import {
  CLUSTER_GRAFANA, PODMONITOR_SCHEMA_ID, grafanaEndpoint, isGrafanaEndpoint, podMonitorSchema, projectGrafana
} from '@/cypress/e2e/blueprints/explorer/workloads/grafana-monitoring';
import { SMALL_CONTAINER } from '@/cypress/e2e/tests/pages/explorer2/workloads/workload.utils';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const NAMESPACE = 'default';
const SCHEMAS_URL = /\/v1\/schemas(\?.*)?$/;
const ENDPOINTS_URL = /\/v1\/endpoints(\/([^/?]+))?(\?.*)?$/;
const GRAFANA_PROXY_URL = /\/services\/http:[^/]+-grafana:80\/proxy\//;

const dashboardsUrl = ({ name }: { name: string }) => new RegExp(`/services/http:${ name }:80/proxy/api/dashboards/uid/`);

const replaceGrafanaEndpoints = (endpoints: ReturnType<typeof grafanaEndpoint>[]) => {
  cy.intercept('GET', ENDPOINTS_URL, (req) => {
    const namespace = req.url.match(ENDPOINTS_URL)?.[2];

    delete req.headers['if-none-match'];
    req.continue((res) => {
      if (Array.isArray(res.body?.data)) {
        res.body.data = [
          ...res.body.data.filter((endpoint: { id: string }) => !isGrafanaEndpoint(endpoint)),
          ...endpoints.filter((endpoint) => !namespace || endpoint.metadata.namespace === namespace)
        ];
      }
    });
  });
};

const addPodMonitorSchema = () => {
  cy.intercept('GET', SCHEMAS_URL, (req) => {
    delete req.headers['if-none-match'];
    req.continue((res) => {
      if (Array.isArray(res.body?.data) && !res.body.data.some((schema: { id: string }) => schema.id === PODMONITOR_SCHEMA_ID)) {
        res.body.data.push(podMonitorSchema);
      }
    });
  });
};

describe('Workload metrics', { tags: ['@explorer2', '@adminUser'] }, () => {
  let deploymentName: string;

  const openDetailPage = () => {
    const detailPage = new WorkloadsDeploymentsDetailsPagePo(deploymentName);

    detailPage.goTo();
    detailPage.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);
    cy.get('[data-testid="btn-pods"]', LONG_TIMEOUT_OPT).should('be.visible');
  };

  before(() => {
    cy.login();

    cy.createE2EResourceName('grafana-gate').then((name) => {
      deploymentName = name;

      cy.createRancherResource('v1', 'apps.deployments', JSON.stringify({
        apiVersion: 'apps/v1',
        kind:       'Deployment',
        metadata:   { name, namespace: NAMESPACE },
        spec:       {
          replicas: 0,
          selector: { matchLabels: { app: name } },
          template: {
            metadata: { labels: { app: name } },
            spec:     { containers: [{ name: SMALL_CONTAINER.name, image: SMALL_CONTAINER.image }] }
          }
        }
      }));
    });
  });

  beforeEach(() => {
    cy.login();

    addPodMonitorSchema();
    cy.intercept('GET', GRAFANA_PROXY_URL).as('grafanaProxy');
  });

  it('should not request any Grafana dashboard when the PodMonitor CRD exists without a Grafana endpoint', () => {
    replaceGrafanaEndpoints([]);

    openDetailPage();

    new ProductNavPo().groupByLabel('Monitoring').should('exist');
    cy.get('@grafanaProxy.all').should('have.length', 0);
    cy.get('[data-testid="btn-workload-metrics"]').should('not.exist');
  });

  it('should show cluster metrics when the Rancher Monitoring Grafana endpoint exists', () => {
    replaceGrafanaEndpoints([grafanaEndpoint(CLUSTER_GRAFANA)]);
    cy.intercept('GET', dashboardsUrl(CLUSTER_GRAFANA), { statusCode: 200, body: {} }).as('clusterDashboards');

    openDetailPage();

    cy.get('@clusterDashboards.all').should('have.length', 2);
    cy.get('[data-testid="btn-workload-metrics"]').should('be.visible');
  });

  it('should show project metrics when only the project Grafana endpoint exists', () => {
    cy.getRancherResource('v1', 'namespaces', NAMESPACE).then((resp) => {
      const projectId = resp.body.metadata.labels['field.cattle.io/projectId'];

      expect(projectId, `the ${ NAMESPACE } namespace belongs to a project`).to.be.a('string');
      replaceGrafanaEndpoints([grafanaEndpoint(projectGrafana(projectId))]);
      cy.intercept('GET', dashboardsUrl(projectGrafana(projectId)), { statusCode: 200, body: {} }).as('projectDashboards');
    });
    cy.intercept('GET', dashboardsUrl(CLUSTER_GRAFANA)).as('clusterDashboards');

    openDetailPage();

    cy.get('@clusterDashboards.all').should('have.length', 0);
    cy.get('@projectDashboards.all').should('have.length', 2);
    cy.get('[data-testid="btn-workload-metrics"]').should('be.visible');
  });

  after(() => {
    if (deploymentName) {
      cy.deleteRancherResource('v1', 'apps.deployments', `${ NAMESPACE }/${ deploymentName }`, false);
    }
  });
});
