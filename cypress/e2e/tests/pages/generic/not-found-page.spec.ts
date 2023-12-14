import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import WorkloadListPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import NotFoundPagePo from '@/cypress/e2e/po/pages/not-found-page.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('Not found page display', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('Will show a 404 if we do not have a valid Product id on the route path', () => {
    const notFound = new NotFoundPagePo('/c/_/bogus-product-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Product bogus-product-id not found');
  });

  it('Will show a 404 if we do not have a valid Resource type on the route path', () => {
    const notFound = new NotFoundPagePo('/c/_/manager/bogus-resource-type');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Resource type bogus-resource-type not found');
  });

  it('Will show a 404 if we do not have a valid Resource id on the route path', () => {
    const notFound = new NotFoundPagePo('/c/_/manager/provisioning.cattle.io.cluster/fleet-default/bogus-resource-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Resource provisioning.cattle.io.cluster with id fleet-default/bogus-resource-id not found, unable to display resource details');
  });

  it('Will show a 404 if we do not have a valid product + resource + resource id', () => {
    const notFound = new NotFoundPagePo('/c/_/bogus-product-id/bogus-resource/bogus-resource-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Product bogus-product-id not found');
  });

  it('Will not show a 404 if we have a valid product + resource', () => {
    const clusterManager = new NotFoundPagePo('/c/_/manager/provisioning.cattle.io.cluster');

    clusterManager.goTo();
    clusterManager.waitForPage();
    clusterManager.errorTitle().should('not.exist');
  });

  it('Will not show a 404 for a valid type from the Norman API', () => {
    const cloudCredCreatePage = new NotFoundPagePo('/c/_/manager/cloudCredential/create');

    cloudCredCreatePage.goTo();
    cloudCredCreatePage.waitForPage();
    cloudCredCreatePage.errorTitle().should('not.exist');
  });

  it('Will not show a 404 for a valid type that does not have a real schema', () => {
    const workloadPage = new NotFoundPagePo('/c/local/explorer/workload');

    workloadPage.goTo();
    workloadPage.waitForPage();
    workloadPage.errorTitle().should('not.exist');
  });

  it('Will not show a 404 if we have a valid product + resource and we nav to page', () => {
    const page = new PagePo('');
    const homePage = new HomePagePo();
    const notFoundPage = new NotFoundPagePo('');
    const workloadsPage = new WorkloadListPagePo();
    const workloadPodsPage = new WorkloadsPodsListPagePo();
    const clustersPage = new ClusterManagerListPagePo('_');

    homePage.goTo();

    page.navToClusterMenuEntry('local');

    page.navToSideMenuGroupByLabel('Workloads');
    workloadsPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');

    page.navToSideMenuEntryByLabel('Pods');
    workloadPodsPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');

    page.navToMenuEntry('Cluster Management');
    clustersPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');
  });
});
