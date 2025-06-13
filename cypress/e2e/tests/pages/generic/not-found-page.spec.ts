import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import NotFoundPagePo from '@/cypress/e2e/po/pages/not-found-page.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
import ChartRepositoriesPagePo from '~/cypress/e2e/po/pages/chart-repositories.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';

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
    const chartsPage = new NotFoundPagePo('/c/local/apps/charts');

    chartsPage.goTo();
    chartsPage.waitForPage();
    chartsPage.errorTitle().should('not.exist');
  });

  it('Will not show a 404 if we have a valid product + resource and we nav to page', () => {
    const page = new PagePo('');
    const homePage = new HomePagePo();
    const notFoundPage = new NotFoundPagePo('');
    const chartsPage = new ChartsPage();
    const reposPage = new ChartRepositoriesPagePo('local', 'apps');
    const clustersPage = new ClusterManagerListPagePo('_');

    homePage.goTo();

    page.navToClusterMenuEntry('local');

    page.navToSideMenuGroupByLabel('Apps');
    chartsPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');

    page.navToSideMenuEntryByLabel('Repositories');
    reposPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');

    page.navToMenuEntry('Cluster Management');
    clustersPage.waitForPage();
    notFoundPage.errorTitle().should('not.exist');
  });
});
