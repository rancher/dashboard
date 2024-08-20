import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import KubewardenPo from '@/cypress/e2e/po/extensions/kubewarden/kubewarden.utils';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import ChartInstalledAppsPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import ProjectsNamespacesPagePo from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';
import IngressEditPagePo from '@/cypress/e2e/po/edit/ingress.po';
import { IngressPagePo } from '@/cypress/e2e/po/pages/explorer/ingress.po';
import { CronjobListPagePo } from '@/cypress/e2e/po/pages/explorer/cronjob.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import * as jsyaml from 'js-yaml';

const EXTENSION_NAME = 'kubewarden';
const EXTENSION_VERSION = '2.0.0';
const EXTENSION_REPO = 'https://github.com/rancher/kubewarden-ui';
const EXTENSION_BRANCH = 'gh-pages';
const EXTENSION_CLUSTER_REPO_NAME = 'kubewarden-ui-extension';
// const EXTENSION_KW_REPO_ADD = 'addKwRepo';
const RANCHER_CHART_CREATION = 'rancherCreation';
const MAIN_EXTENSION_CHART_CREATION = 'chartCreation';
const MAIN_EXTENSION_CHART_UPGRADE = 'chartUpgrade';

const DUMMY_NAMESPACE = 'another-dummy-namespace';
const NAMESPACE_CREATION = 'namespaceCreation';

const INGRESS_POLICY_NAME = 'some-ingress-policy-name';
const INGRESS_NAME = 'some-ingress-name';
const INGRESS_CREATION = 'ingressCreation';
const AP_CREATION = 'apCreation';
const POLICY_SERVER_CREATION = 'psCreation';

const POLICY_SERVER_YAML_NAME = 'some-policy-server-yaml-name';

const kubewardenPo = new KubewardenPo();
const namespaceFilter = new NamespaceFilterPo();
const installedApps = new ChartInstalledAppsPagePo('local', 'apps');
const projectsNamespacesPage = new ProjectsNamespacesPagePo('local');
const ingressPageListPo = new IngressPagePo();
const ingressPageEditPo = new IngressEditPagePo('local');
const cronjobListPagePo = new CronjobListPagePo();

describe('Extensions Compatibility spec', { tags: ['@kubewarden', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('add extension repository', () => {
    // // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.addExtensionsRepositoryDirectLink(EXTENSION_REPO, EXTENSION_BRANCH, EXTENSION_CLUSTER_REPO_NAME, true);
    // let's wait a bit so that the repo is available in extensions screen
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionLabel(EXTENSION_VERSION);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should setup all of the needed backend parts', () => {
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as(RANCHER_CHART_CREATION);
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=install').as(MAIN_EXTENSION_CHART_CREATION);
    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=upgrade').as(MAIN_EXTENSION_CHART_UPGRADE);

    kubewardenPo.dashboard().goTo();
    kubewardenPo.dashboard().waitForTitlePreControllerInstall();

    // we need to change the namespace picker in order for the install check
    // so that we can see all apps on the list view and check their statuses
    namespaceFilter.toggle();
    namespaceFilter.clickOptionByLabel('All Namespaces');
    namespaceFilter.closeDropdown();

    // start install steps (kw dashboard/main page)
    kubewardenPo.dashboard().startBackendInstallClick();

    // 1 - install cert manager
    kubewardenPo.dashboard().openTerminalClick();
    kubewardenPo.kubectlShell().executeCommand('kubectl apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml', false);
    kubewardenPo.waitForCertManagerToInstall();
    kubewardenPo.kubectlShell().closeTerminal();

    // 2 - Add kubewarden repository
    kubewardenPo.dashboard().addKwRepoClick();
    kubewardenPo.waitForKwRepoToBeAdded();

    // 3 - Install kubewarden operator
    kubewardenPo.dashboard().installOperatorBtnClick();
    kubewardenPo.chartInstallPage().waitForChartPage('kubewarden-charts', 'kubewarden-controller');
    kubewardenPo.chartInstallPage().nextPage();
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Enable Policy Reporter UI').set();
    kubewardenPo.chartInstallPage().installChart();
    kubewardenPo.appsPage().waitForInstallCloseTerminal(MAIN_EXTENSION_CHART_CREATION, ['rancher-kubewarden-controller', 'rancher-kubewarden-crds'], 60000);

    kubewardenPo.dashboard().goTo();
    kubewardenPo.dashboard().waitForTitleAfterControllerInstall();

    // 4 - add default policy server charts
    kubewardenPo.dashboard().defaultPolicyServerInstallClick();
    kubewardenPo.chartInstallPage().waitForChartPage('kubewarden-charts', 'kubewarden-defaults');
    kubewardenPo.chartInstallPage().nextPage();
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Enable recommended policies').set();
    kubewardenPo.chartInstallPage().installChart();
    kubewardenPo.appsPage().waitForInstallCloseTerminal(MAIN_EXTENSION_CHART_CREATION, ['rancher-kubewarden-defaults'], 30000);

    installedApps.goTo();
    installedApps.waitForPage();

    // ***** 5 - Install Tracing parts *****
    // 5.1 - Open Telemetry Operator as per https://docs.kubewarden.io/next/howtos/telemetry/opentelemetry-qs#install-opentelemetry
    const addOTCommand = `helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

helm install --wait \
  --namespace open-telemetry \
  --create-namespace \
  --version 0.56.0 \
  --set "manager.collectorImage.repository=otel/opentelemetry-collector-contrib" \
  my-opentelemetry-operator open-telemetry/opentelemetry-operator`;

    kubewardenPo.kubectlShell().openTerminal();
    kubewardenPo.kubectlShell().executeCommand(addOTCommand, false);
    kubewardenPo.appsPage().waitForAppToInstall('my-opentelemetry-operator');

    // 5.2 - Jaeger Operator as per https://docs.kubewarden.io/next/howtos/telemetry/tracing-qs#install-jaeger
    const addJaegerOperatorCommand = `helm repo add jaegertracing https://jaegertracing.github.io/helm-charts

helm upgrade -i --wait \
  --namespace jaeger \
  --create-namespace \
  --version 2.49.0 \
  jaeger-operator jaegertracing/jaeger-operator \
  --set rbac.clusterRole=true`;

    kubewardenPo.kubectlShell().openTerminal();
    kubewardenPo.kubectlShell().executeCommand(addJaegerOperatorCommand, false);
    kubewardenPo.appsPage().waitForAppToInstall('jaeger-operator');

    // 5.3 - Create Jaeger Resource as per https://docs.kubewarden.io/next/howtos/telemetry/tracing-qs#install-jaeger
    const createJaegerResource = `kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: my-open-telemetry
  namespace: jaeger
spec:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
EOF`;

    kubewardenPo.kubectlShell().openTerminal();
    kubewardenPo.kubectlShell().executeCommand(createJaegerResource, false);
    cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
    kubewardenPo.kubectlShell().closeTerminal();

    // 5.4 - Enable Tracing in kubewarden operator chart
    installedApps.goTo();
    installedApps.waitForPage();

    installedApps.list().resourceTable().sortableTable().rowActionMenuOpen('rancher-kubewarden-controller')
      .getMenuItem('Edit/Upgrade')
      .click();
    kubewardenPo.chartInstallPage().nextPage();
    new TabbedPo().clickTabWithSelector('[data-testid="btn-Telemetry"]'); // go to Telemetry tab
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Enable Tracing').set();
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Jaeger endpoint insecure TLS configuration').set();
    kubewardenPo.chartInstallPage().installChart();
    kubewardenPo.appsPage().waitForUpgradeAndCloseTerminal(MAIN_EXTENSION_CHART_UPGRADE, 60000);

    // 6 - ***** Install Metrics part *****

    // 6.1 - Install Rancher Monitoring app
    // needs to be a manual visit as the goTo + createPath were adding unnecessary chars that made url assertion fail
    cy.visit('c/local/apps/charts/install?repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');
    kubewardenPo.chartInstallPage().waitForChartPage('rancher-charts', 'rancher-monitoring');
    // monitoring chart install page takes a bit to come up. The search for "rancherMonitoringInstallIntoProjectSelect"
    // might fail because of this. Let's give it a time buffer here
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
    kubewardenPo.rancherMonitoringInstallIntoProjectSelect(3); // System option
    kubewardenPo.chartInstallPage().nextPage();
    new TabbedPo().clickTabWithSelector('[data-testid="alerting"]'); // go to Alerting tab
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Deploy Alertmanager').set(); // uncheck deploy alertmanager
    kubewardenPo.chartInstallPage().installChart();
    kubewardenPo.appsPage().waitForInstallCloseTerminal(RANCHER_CHART_CREATION, ['rancher-monitoring', 'rancher-monitoring-crd'], 180000, 30000);

    // 6.2 - Add Service Monitor
    kubewardenPo.policyServerDetail('local', 'default').goTo('local', 'default');
    kubewardenPo.policyServerDetail('local', 'default').waitForPage();
    new TabbedPo().clickTabWithSelector('[data-testid="btn-policy-metrics"]'); // go to Metrics tab

    kubewardenPo.policyServerDetail('local', 'default').metricsAddServiceMonitorClick();
    // buffer for service monitor to install and be available
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting

    // 6.3 - Add Grafana Dashboards
    kubewardenPo.policyServerDetail('local', 'default').metricsAddGrafanaDasboardClick();
    // buffer for Grafana Dashboards to install and be available
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting

    // 6.4 - Enable Metrics in kubewarden operator chart
    installedApps.goTo();
    installedApps.waitForPage();

    installedApps.list().resourceTable().sortableTable().rowActionMenuOpen('rancher-kubewarden-controller')
      .getMenuItem('Edit/Upgrade')
      .click();
    kubewardenPo.chartInstallPage().nextPage();
    new TabbedPo().clickTabWithSelector('[data-testid="btn-Telemetry"]'); // go to Telemetry tab
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Enable Metrics').set();
    kubewardenPo.chartInstallPage().installChart();
    kubewardenPo.appsPage().waitForUpgradeAndCloseTerminal(MAIN_EXTENSION_CHART_UPGRADE, 60000);
  });

  it('Should create an Admission Policy and report it in the compliance tab of a namespace', () => {
    cy.intercept('POST', 'v1/namespaces').as(NAMESPACE_CREATION);
    cy.intercept('POST', `v1/policies.kubewarden.io.admissionpolicies/${ DUMMY_NAMESPACE }`).as(AP_CREATION);
    cy.intercept('POST', 'v1/networking.k8s.io.ingresses').as(INGRESS_CREATION);

    // 1. create a new namespace
    projectsNamespacesPage.goTo();
    projectsNamespacesPage.waitForPage();
    projectsNamespacesPage.flatListClick(); // easier to trigger a namespace creation
    projectsNamespacesPage.createProjectNamespaceClick();
    projectsNamespacesPage.name().set(DUMMY_NAMESPACE);
    projectsNamespacesPage.buttonSubmit().click();

    kubewardenPo.waitForNamespaceCreation(NAMESPACE_CREATION, DUMMY_NAMESPACE);

    // 2. create a new admission policy
    kubewardenPo.dashboard().goTo();
    kubewardenPo.dashboard().waitForTitleAfterControllerInstall();

    kubewardenPo.dashboard().productNav().navToSideMenuEntryByExactLabel('AdmissionPolicies');
    kubewardenPo.admissionPoliciesList().waitForPage();

    // 2.1 whitelist url for artifacthub
    kubewardenPo.genericResourceList().masthead().create();
    kubewardenPo.admissionPoliciesList().addToArtifactHubClick();
    // let's wait for the whitelisting to do it's thing
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting

    // 2.2 create admission policy and wait for it to be available
    kubewardenPo.admissionPoliciesList().admissionPolicyOfficialPoliciesTableRowClick('Ingress Policy');

    kubewardenPo.admissionPoliciesEdit('local').waitForPage();
    kubewardenPo.admissionPoliciesEdit('local').nameNsDescription().namespace().toggle();
    kubewardenPo.admissionPoliciesEdit('local').nameNsDescription().namespace().clickOptionWithLabel(DUMMY_NAMESPACE);
    kubewardenPo.admissionPoliciesEdit('local').nameNsDescription().name().set(INGRESS_POLICY_NAME);
    new TabbedPo().clickTabWithSelector('[data-testid="btn-Settings"]'); // go to Settings tab
    kubewardenPo.chartInstallPage().getCheckboxByLabel('Require TLS').set();

    kubewardenPo.admissionPoliciesEdit('local').admissionPolicyCreateBtn().click();
    // wait for policy creation by checking xhr request + status
    kubewardenPo.waitForAdmissionPolicyCreation(AP_CREATION, INGRESS_POLICY_NAME, DUMMY_NAMESPACE);

    // 3. create a resource for the compliance report (Ingress)
    ingressPageEditPo.goTo('local');
    ingressPageEditPo.waitForPage();
    ingressPageEditPo.nameNsDescription().namespace().toggle();
    ingressPageEditPo.nameNsDescription().namespace().clickOptionWithLabel(DUMMY_NAMESPACE);
    ingressPageEditPo.nameNsDescription().name().set(INGRESS_NAME);
    ingressPageEditPo.saveForm().click();
    ingressPageListPo.waitForIngressCreation(INGRESS_CREATION, INGRESS_NAME, DUMMY_NAMESPACE);

    // 4. go to audit-scanner cron job and run it
    cronjobListPagePo.goTo();
    cronjobListPagePo.waitForPage();
    cronjobListPagePo.list().resourceTable().sortableTable().rowActionMenuOpen('audit-scanner')
      .getMenuItem('Run Now')
      .click();
    cronjobListPagePo.jobDetail('local', 'cattle-kubewarden-system/audit-scanner').successfulCountCheck(1);

    // 5. go to the given namespace and check the compliance report to confirm the result
    projectsNamespacesPage.namespaceDetail('local', DUMMY_NAMESPACE).goTo('local', DUMMY_NAMESPACE);
    projectsNamespacesPage.namespaceDetail('local', DUMMY_NAMESPACE).waitForPage();
    projectsNamespacesPage.namespaceDetail('local', DUMMY_NAMESPACE).clickComplianceTab();
    projectsNamespacesPage.namespaceDetail('local', DUMMY_NAMESPACE).complianceSortableTable().rowElementWithPartialName(INGRESS_POLICY_NAME).scrollIntoView()
      .should('be.visible');
    projectsNamespacesPage.namespaceDetail('local', DUMMY_NAMESPACE).complianceSortableTable().rowElementWithPartialName(INGRESS_NAME).scrollIntoView()
      .should('be.visible');
  });

  it('Should create a Policy Server via YAML', () => {
    cy.intercept('POST', 'v1/policies.kubewarden.io.policyservers').as(POLICY_SERVER_CREATION);

    const maxPollingRetries = 36;
    let pollingCounter = 0;

    function pollingSchemaDefinition() {
      cy
        .request({
          url:              'v1/schemaDefinitions/policies.kubewarden.io.policyserver',
          method:           'GET',
          failOnStatusCode: false
        })
        .then((resp) => {
          pollingCounter++;

          if (resp.status === 200 || pollingCounter === maxPollingRetries) {
            return;
          }

          if (pollingCounter === maxPollingRetries) {
            throw new Error('schemaDefinition polling failed');
          }

          // let's wait for a bit so that we don't overload the server
          // with requests
          cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
          pollingSchemaDefinition();
        });
    }

    kubewardenPo.policyServerEdit('local').goTo('local');
    kubewardenPo.policyServerEdit('local').waitForPage().then(pollingSchemaDefinition);

    // after we hit create from YAML we need to pool for the schemaDefinition since
    // that takes while to be available https://docs.cypress.io/api/commands/request#Request-Polling
    kubewardenPo.policyServerEdit('local').editYamlBtnClick().then(pollingSchemaDefinition);

    kubewardenPo.policyServerEdit('local').codeMirror().value()
      .then((val) => {
      // convert yaml into json to update values
        const json: any = jsyaml.load(val);

        json.metadata.name = POLICY_SERVER_YAML_NAME;

        kubewardenPo.policyServerEdit('local').codeMirror().set(jsyaml.dump(json));
        kubewardenPo.policyServerEdit('local').saveForm().click();
        kubewardenPo.policyServerEdit('local').waitForPolicyServerCreation(POLICY_SERVER_CREATION, POLICY_SERVER_YAML_NAME);

        kubewardenPo.policyServerList().waitForPage();
        kubewardenPo.genericResourceList().resourceTable().sortableTable().rowWithName(POLICY_SERVER_YAML_NAME)
          .column(2)
          .should('contain', POLICY_SERVER_YAML_NAME);

        // Active state needs a time buffer to kick in
        cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
        kubewardenPo.genericResourceList().resourceTable().sortableTable().rowWithName(POLICY_SERVER_YAML_NAME)
          .column(1)
          .should('contain', 'Active');
      });
  });

  it('Should uninstall the extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();
    extensionsPo.extensionReloadBanner().should('be.visible');

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  });
});
