import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import KubewardenPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/kubewarden.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import ChartInstalledAppsPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import ProjectsNamespacesPagePo from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { IngressPagePo } from '@/cypress/e2e/po/pages/explorer/ingress.po';
// import * as jsyaml from 'js-yaml';

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
const AP_CREATION = 'apCreation';

const kubewardenPo = new KubewardenPo();
const namespacePicker = new NamespaceFilterPo();
const installedApps = new ChartInstalledAppsPagePo('local', 'apps');
const projectsNamespacesPage = new ProjectsNamespacesPagePo('local');
const sideNav = new ProductNavPo();
const ingressPagePo = new IngressPagePo();

describe('Extensions Compatibility spec', { tags: ['@kubewarden', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  //   it('add extension repository', () => {
  //     // // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
  //     const extensionsPo = new ExtensionsPagePo();

  //     extensionsPo.addExtensionsRepositoryDirectLink(EXTENSION_REPO, EXTENSION_BRANCH, EXTENSION_CLUSTER_REPO_NAME, true);
  //     cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  //   });

  //   it('Should install an extension', () => {
  //     const extensionsPo = new ExtensionsPagePo();

  //     extensionsPo.goTo();

  //     extensionsPo.extensionTabAvailableClick();

  //     // click on install button on card
  //     extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
  //     extensionsPo.extensionInstallModal().should('be.visible');

  //     // select version and click install
  //     extensionsPo.installModalSelectVersionLabel(EXTENSION_VERSION);
  //     extensionsPo.installModalInstallClick();

  //     // let's check the extension reload banner and reload the page
  //     extensionsPo.extensionReloadBanner().should('be.visible');
  //     extensionsPo.extensionReloadClick();

  //     // make sure extension card is in the installed tab
  //     extensionsPo.extensionTabInstalledClick();
  //     extensionsPo.extensionCardClick(EXTENSION_NAME);
  //     extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  //     extensionsPo.extensionDetailsCloseClick();
  //   });

  //   it('Should setup all of the needed backend parts', () => {
  //     cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as(RANCHER_CHART_CREATION);
  //     cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=install').as(MAIN_EXTENSION_CHART_CREATION);
  //     cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/kubewarden-charts?action=upgrade').as(MAIN_EXTENSION_CHART_UPGRADE);

  //     kubewardenPo.goTo();
  //     kubewardenPo.waitForTitle('h1', 'Kubewarden');

  //     // we need to change the namespace picker in order for the install check on the list view
  //     namespacePicker.toggle();
  //     namespacePicker.clickOptionByLabel('All Namespaces');
  //     namespacePicker.closeDropdown();

  //     // start install steps
  //     kubewardenPo.startBackendInstallClick();

  //     // 1 - install cert manager
  //     kubewardenPo.openTerminalClick();
  //     kubewardenPo.kubectlShell().executeCommand('kubectl apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml', false);
  //     kubewardenPo.waitForCertManagerToInstall();
  //     kubewardenPo.kubectlShell().closeTerminal();

  //     // 2 - Add kubewarden repository
  //     kubewardenPo.addKwRepoClick();
  //     kubewardenPo.waitForKwRepoToBeAdded();

  //     // 3 - Install kubewarden operator
  //     kubewardenPo.installOperatorBtnClick();
  //     kubewardenPo.waitForInstallChartPage('kubewarden-charts', 'kubewarden-controller');
  //     kubewardenPo.chartInstallNext();
  //     kubewardenPo.genericCheckboxByLabel('Enable Policy Reporter UI').set();
  //     kubewardenPo.chartInstallClick();
  //     kubewardenPo.chartInstallWaitForInstallationAndCloseTerminal(MAIN_EXTENSION_CHART_CREATION, ['rancher-kubewarden-controller', 'rancher-kubewarden-crds'], 60000);

  //     kubewardenPo.goTo();
  //     kubewardenPo.waitForTitle('[data-testid="kw-dashboard-title"]', 'Welcome to Kubewarden');

  //     // 4 - add default policy server charts
  //     kubewardenPo.defaultPolicyServerInstallClick();
  //     kubewardenPo.waitForInstallChartPage('kubewarden-charts', 'kubewarden-defaults');
  //     kubewardenPo.chartInstallNext();
  //     kubewardenPo.genericCheckboxByLabel('Enable recommended policies').set();
  //     kubewardenPo.chartInstallClick();
  //     kubewardenPo.chartInstallWaitForInstallationAndCloseTerminal(MAIN_EXTENSION_CHART_CREATION, ['rancher-kubewarden-defaults'], 30000);

  //     installedApps.goTo();
  //     installedApps.waitForPage();

  //     // 5 - Install Tracing parts
  //     // 5.1 - Open Telemetry Operator as per https://docs.kubewarden.io/next/howtos/telemetry/opentelemetry-qs#install-opentelemetry
  //     const addOTCommand = `helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

  // helm install --wait \
  //   --namespace open-telemetry \
  //   --create-namespace \
  //   --version 0.56.0 \
  //   --set "manager.collectorImage.repository=otel/opentelemetry-collector-contrib" \
  //   my-opentelemetry-operator open-telemetry/opentelemetry-operator`;

  //     kubewardenPo.kubectlShell().openTerminal();
  //     kubewardenPo.kubectlShell().executeCommand(addOTCommand, false);
  //     kubewardenPo.genericWaitForAppToInstall('my-opentelemetry-operator');

  //     // 5.2 - Jaeger Operator as per https://docs.kubewarden.io/next/howtos/telemetry/tracing-qs#install-jaeger
  //     const addJaegerOperatorCommand = `helm repo add jaegertracing https://jaegertracing.github.io/helm-charts

  // helm upgrade -i --wait \
  //   --namespace jaeger \
  //   --create-namespace \
  //   --version 2.49.0 \
  //   jaeger-operator jaegertracing/jaeger-operator \
  //   --set rbac.clusterRole=true`;

  //     kubewardenPo.kubectlShell().openTerminal();
  //     kubewardenPo.kubectlShell().executeCommand(addJaegerOperatorCommand, false);
  //     kubewardenPo.genericWaitForAppToInstall('jaeger-operator');

  //     // 5.3 - Create Jaeger Resource as per https://docs.kubewarden.io/next/howtos/telemetry/tracing-qs#install-jaeger
  //     const createJaegerResource = `kubectl apply -f - <<EOF
  // apiVersion: jaegertracing.io/v1
  // kind: Jaeger
  // metadata:
  //   name: my-open-telemetry
  //   namespace: jaeger
  // spec:
  //   ingress:
  //     enabled: true
  //     annotations:
  //       kubernetes.io/ingress.class: nginx
  // EOF`;

  //     kubewardenPo.kubectlShell().openTerminal();
  //     kubewardenPo.kubectlShell().executeCommand(createJaegerResource, false);
  //     cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
  //     kubewardenPo.kubectlShell().closeTerminal();

  //     // 5.4 - Enable Tracing in kubewarden operator chart
  //     installedApps.goTo();
  //     installedApps.waitForPage();

  //     installedApps.list().resourceTable().sortableTable().rowActionMenuOpen('rancher-kubewarden-controller')
  //       .getMenuItem('Edit/Upgrade')
  //       .click();
  //     kubewardenPo.chartInstallNext();
  //     kubewardenPo.clickGenericTab('[data-testid="btn-Telemetry"]');
  //     kubewardenPo.genericCheckboxByLabel('Enable Tracing').set();
  //     kubewardenPo.genericCheckboxByLabel('Jaeger endpoint insecure TLS configuration').set();
  //     kubewardenPo.chartInstallClick();
  //     kubewardenPo.chartInstallWaitForUpgradeAndCloseTerminal(MAIN_EXTENSION_CHART_UPGRADE, 60000);

  //     // 6 - Install Metrics part
  //     // 6.1 - Install Rancher Monitoring app
  //     // needs to be a manual visit as the goTo + createPath were adding unnecessary chars
  //     // that made url assertion fail
  //     cy.visit('c/local/apps/charts/install?repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');
  //     kubewardenPo.waitForInstallChartPage('rancher-charts', 'rancher-monitoring');
  //     // monitoring chart install page takes a bit to come up. The search for "rancherMonitoringInstallIntoProjectSelect"
  //     // might fail because of this. Let's give it a 10s buffer here
  //     cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  //     kubewardenPo.rancherMonitoringInstallIntoProjectSelect(3); // System option
  //     kubewardenPo.chartInstallNext();
  //     kubewardenPo.clickGenericTab('[data-testid="alerting"]'); // go to Alerting tab
  //     kubewardenPo.genericCheckboxByLabel('Deploy Alertmanager').set(); // uncheck deploy alertmanager
  //     kubewardenPo.chartInstallClick();
  //     kubewardenPo.chartInstallWaitForInstallationAndCloseTerminal(RANCHER_CHART_CREATION, ['rancher-monitoring', 'rancher-monitoring-crd'], 180000, 30000);

  //     cy.visit('/c/local/kubewarden/policies.kubewarden.io.policyserver/default');
  //     kubewardenPo.clickGenericTab('[data-testid="btn-policy-metrics"]');
  //     // 6.2 - Add Service Monitor
  //     kubewardenPo.metricsAddServiceMonitorClick();
  //     // buffer for service monitor to install and be available
  //     cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
  //     // 6.3 - Add Grafana Dashboards
  //     // buffer for Grafana Dashboards to install and be available
  //     kubewardenPo.metricsAddGrafanaDasboardClick();
  //     cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting

  //     // 6.4 - Enable Metrics in kubewarden operator chart
  //     installedApps.goTo();
  //     installedApps.waitForPage();

  //     installedApps.list().resourceTable().sortableTable().rowActionMenuOpen('rancher-kubewarden-controller')
  //       .getMenuItem('Edit/Upgrade')
  //       .click();
  //     kubewardenPo.chartInstallNext();
  //     kubewardenPo.clickGenericTab('[data-testid="btn-Telemetry"]');
  //     kubewardenPo.genericCheckboxByLabel('Enable Metrics').set();
  //     kubewardenPo.chartInstallClick();
  //     kubewardenPo.chartInstallWaitForUpgradeAndCloseTerminal(MAIN_EXTENSION_CHART_UPGRADE, 60000);
  //   });

  it('Should create an Admission Policy and report it in the compliance tab of a namespace', () => {
    cy.intercept('POST', 'v1/namespaces').as(NAMESPACE_CREATION);
    cy.intercept('POST', 'v1/policies.kubewarden.io.admissionpolicies/default').as(AP_CREATION);
    // create a new namespace
    // create an AP -> keep it protect mode
    // prepare a resource to trigger that specific AP
    // go to cron job and force run it
    // go to a given namespace and check the compliance report to see the result
    // projectsNamespacesPage.goTo();
    // projectsNamespacesPage.waitForPage();
    // projectsNamespacesPage.flatListClick(); // easier to trigger a namespace creation
    // projectsNamespacesPage.createProjectNamespaceClick();
    // projectsNamespacesPage.name().set(DUMMY_NAMESPACE);
    // projectsNamespacesPage.buttonSubmit().click();

    // kubewardenPo.waitForNamespaceCreation(NAMESPACE_CREATION, DUMMY_NAMESPACE);

    kubewardenPo.goTo();
    kubewardenPo.waitForTitle('[data-testid="kw-dashboard-title"]', 'Welcome to Kubewarden');

    kubewardenPo.sideMenuNavTo('AdmissionPolicies');
    kubewardenPo.waitForPage();

    kubewardenPo.createClick();
    // kubewardenPo.addToArtifactHubClick();
    // // let's wait for the whitelisting to do it's thing
    // cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting

    kubewardenPo.apOfficialPoliciesTableRowClick('Ingress Policy');

    kubewardenPo.genericNamespaceInput().toggle();
    kubewardenPo.genericNamespaceInput().clickOptionWithLabel(DUMMY_NAMESPACE);
    kubewardenPo.genericNameInput().set(INGRESS_POLICY_NAME);
    kubewardenPo.clickGenericTab('[data-testid="btn-Settings"]');
    kubewardenPo.genericCheckboxByLabel('Require TLS').set();

    // kubewardenPo.apCreateBtn().click();
    // kubewardenPo.waitForApCreation(AP_CREATION, INGRESS_POLICY_NAME);

    // HERE WE'LL NEED TO WAIT FOR THE POLICY TO COME UP!

    // sideNav.navToSideMenuGroupByLabel('Service Discovery');
    // sideNav.navToSideMenuEntryByLabel('Ingresses');

    // ingressPagePo.waitForPage();
    // ingressPagePo.clickCreate();
  });

  // it('Should create a Policy Server via YAML', () => {
  // // create a working Policy Server via YAML
  // });

  // it('Should uninstall the extension', () => {
  //   const extensionsPo = new ExtensionsPagePo();

  //   extensionsPo.goTo();
  //   extensionsPo.extensionTabInstalledClick();

  //   // click on uninstall button on card
  //   extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
  //   extensionsPo.extensionUninstallModal().should('be.visible');
  //   extensionsPo.uninstallModaluninstallClick();
  //   extensionsPo.extensionReloadBanner().should('be.visible');

  //   // let's check the extension reload banner and reload the page
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();

  //   // make sure extension card is in the available tab
  //   extensionsPo.extensionTabAvailableClick();
  //   extensionsPo.extensionCardClick(EXTENSION_NAME);
  //   extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  // });
});
