import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { qase } from '@/cypress/support/qase';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const clusterMgmtClusterList = new ClusterManagerListPagePo('local');
const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';

describe('Home Page List', { testIsolation: false }, () => {
  const homePage = new HomePagePo();
  const homeClusterList = homePage.list();

  before(() => {
    cy.login();
  });

  qase(8563, it('Validate home page with percy', { tags: ['@generic', '@adminUser'] }, () => {
    // Navigate to home page and wait for page to be fully loaded.
    HomePagePo.goToAndWaitForGet();

    // #takes percy snapshot.
    cy.percySnapshot('Home Page');
  }));

  qase(14900, it('Can see that cluster details match those in Cluster Management page', { tags: ['@generic', '@adminUser'] }, () => {
    /**
       * Get cluster details from the Home page
       * Verify that the cluster details match those on the Cluster Management page
       */
    const clusterName = 'local';

    // [CREATE ISSUE FOR CODE FIX] The home cluster list rows are provisioning clusters whose version
    // is derived from the linked management cluster (provisioning.cattle.io.cluster.kubernetesVersion
    // -> this.mgmt?.kubernetesVersion). The home page never fetches management clusters itself - its
    // secondary fetch (management.cattle.io.cluster.utils.ts fetchSecondaryResources) only loads
    // provisioning clusters - so if the management clusters are not already in the store, `.mgmt` is
    // undefined and the version renders a bare '—' that never resolves on this page. The home list
    // should load the management clusters it links to (or show a pending state) rather than '—'.
    //
    // Warm the management-cluster store by visiting Cluster Management first (the page this test
    // already compares against reliably loads them), so `.mgmt` resolves when we read the home list.
    clusterMgmtClusterList.goTo();
    clusterMgmtClusterList.waitForPage();
    clusterMgmtClusterList.sortableTable().checkLoadingIndicatorNotVisible();
    clusterMgmtClusterList.sortableTable().rowWithName(clusterName).checkVisible();

    HomePagePo.navTo();
    homePage.waitForPage();

    // Ensure the cluster list has fully loaded before reading values. Otherwise an
    // async re-render of the still-streaming list can detach the row mid-read.
    homeClusterList.resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    homeClusterList.resourceTable().sortableTable().rowWithName(clusterName).checkVisible();

    // Verify version is present before proceeding
    homeClusterList.version(clusterName).should('not.contain', '—');

    // Get text values and store as aliases.
    // The home cluster list keeps re-rendering rows as the CPU/Memory/Pods metrics
    // stream in, which can detach the row between `.contains()` and `.invoke('text')`
    // under Cypress 12+. Ending each read with a `.should()` makes the whole
    // `contains -> column -> invoke('text')` chain retry, re-querying a fresh
    // (attached) row until the text is read successfully.
    homeClusterList.state(clusterName).invoke('text').should('not.be.empty').as('stateText');
    homeClusterList.name(clusterName).invoke('text').should('not.be.empty').as('nameText');
    homeClusterList.version(clusterName).invoke('text').should('not.be.empty').as('versionText');
    homeClusterList.provider(clusterName).invoke('text').should('not.be.empty').as('providerText');

    clusterMgmtClusterList.goTo();
    clusterMgmtClusterList.waitForPage();

    // Wait for the table to load and the cluster row to be visible
    clusterMgmtClusterList.sortableTable().checkLoadingIndicatorNotVisible();
    clusterMgmtClusterList.sortableTable().rowWithName(clusterName).checkVisible();

    cy.get('@stateText').then((state) => {
      clusterMgmtClusterList.list().state(clusterName).should('contain.text', state);
    });

    cy.get('@nameText').then((nameElm) => {
      const name = (nameElm as unknown as string).trim(); // nameElm is text...

      clusterMgmtClusterList.list().name(clusterName).should('contain.text', name);
    });

    cy.get('@versionText').then((version) => {
      clusterMgmtClusterList.list().version(clusterName).should('contain.text', version);
    });

    cy.get('@providerText').then((provider) => {
      clusterMgmtClusterList.list().provider(clusterName).should('contain.text', provider);
    });
  }));

  qase(4109, it('Can filter rows in the cluster list', { tags: ['@generic', '@adminUser'] }, () => {
    /**
       * Filter rows in the cluster list
       */
    HomePagePo.navTo();
    homePage.waitForPage();

    homeClusterList.resourceTable().sortableTable().filter('random text');
    homeClusterList.resourceTable().sortableTable().rowElements().should((el) => {
      expect(el).to.contain.text('There are no rows which match your search query.');
    });

    homeClusterList.resourceTable().sortableTable().filter('local');
    homeClusterList.name('local').should((el) => {
      expect(el).to.contain.text('local');
    });
  }));

  qase(4108, it('Should show cluster description information in the cluster list', { tags: ['@generic', '@adminUser'] }, () => {
    // since I wasn't able to fully mock a list of clusters
    // the next best thing is to add a description to the current local cluster
    // testing https://github.com/rancher/dashboard/issues/10441

    const homePageWithLocalPagination = '/v1/management.cattle.io.clusters?*';

    // Why the long intercept url?
    // There are two requests to fetch clusters (side nav + cluster list). In theory "cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`" should intercept them both
    // how is not, only the first one for the side nav, and not the second for the list.
    // const homePageWithSSP = `/v1/provisioning.cattle.io.clusters?page=1&pagesize=100&sort=metadata.annotations[provisioning.cattle.io/management-cluster-display-name]&filter=metadata.labels[provider.cattle.io]!=harvester&filter=status.provider!=harvester&exclude=metadata.managedFields`;

    cy.intercept('GET', homePageWithLocalPagination, (req) => {
      req.continue((res) => {
        const localIndex = res.body.data.findIndex((item: any) => item.id === 'local');

        if (localIndex >= 0) {
          res.body.data[localIndex].metadata.annotations['field.cattle.io/description'] = longClusterDescription;
        }

        res.send(res.body);
      });
    }).as('provClusters');

    homePage.goTo();
    homePage.waitForPage();

    homeClusterList.resourceTable().sortableTable().rowWithName('local').column(1)
      .find('.cluster-description')
      .should('contain', longClusterDescription);
  }));

  qase(4107, it('check table headers are visible', { tags: ['@generic', '@adminUser'] }, () => {
    homePage.goTo();
    homePage.waitForPage();

    // check table headers
    const expectedHeaders = ['State', 'Name', 'Provider Distro', 'Kubernetes Version Architecture', 'CPU', 'Memory', 'Pods'];

    homePage.list().resourceTable().sortableTable().tableHeaderRow()
      .get('.table-header-container .content')
      .each((el, i) => {
        const text = el.text().trim().split('\n').map((r) => r.trim())
          .join(' ');

        expect(text).to.eq(expectedHeaders[i]);
      });
  }));
});
