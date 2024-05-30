import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import FleetGitRepoList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.gitrepo.po';
import GitReposTab from '@/cypress/e2e/po/detail/fleet/tabs/git-repos-tab.po';

/**
 * Details component for fleet.cattle.io.gitrepo resources
 */
export default class FleetClusterDetailsPo extends PagePo {
  private static createPath(fleetWorkspace: string, clusterName: string) {
    return `/c/_/fleet/fleet.cattle.io.cluster/${ fleetWorkspace }/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, clusterName: string) {
    super(FleetClusterDetailsPo.createPath(fleetWorkspace, clusterName));
  }

  clusterTabs(): TabbedPo {
    return new TabbedPo();
  }

  gitReposList(): FleetGitRepoList {
    return new FleetGitRepoList(this.self());
  }

  gitReposTab() {
    return new GitReposTab();
  }
}
