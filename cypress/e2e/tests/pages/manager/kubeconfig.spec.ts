import KubeconfigPagePo from '@/cypress/e2e/po/pages/cluster-manager/kubeconfig.po';
import DetailDrawer from '@/cypress/e2e/po/side-bars/detail-drawer.po';
import ResourceYamlPo from '@/cypress/e2e/po/components/resource-yaml.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

describe('Kubeconfig', { tags: ['@manager', '@adminUser'] }, () => {
  let createdKubeconfigId: string;

  beforeEach(() => {
    cy.login();
    HomePagePo.goTo(); // this is needed to ensure we have a valid authentication session
  });

  it('"Show Configuration" shows a working, non-blank YAML tab', () => {
    cy.createRancherResource('v1', 'ext.cattle.io.kubeconfigs', JSON.stringify({
      type: 'ext.cattle.io.kubeconfig',
      spec: { clusters: ['local'], includeDefaultEntry: false }
    })).then((resp: Cypress.Response<any>) => {
      createdKubeconfigId = resp.body.id;

      const kubeconfigDetailPage = new KubeconfigPagePo('_', createdKubeconfigId);

      kubeconfigDetailPage.goTo();
      kubeconfigDetailPage.waitForPage();

      cy.get('[data-testid="show-configuration-cta"]').should('be.visible').click();

      const drawer = new DetailDrawer();

      drawer.checkExists();
      drawer.checkVisible();
      drawer.tabs().clickTabWithName('yaml-tab');

      new ResourceYamlPo(drawer.self()).codeMirror().value().should('not.be.empty');
    });
  });

  after(() => {
    if (createdKubeconfigId) {
      cy.deleteRancherResource('v1', 'ext.cattle.io.kubeconfigs', createdKubeconfigId, false);
    }
  });
});
