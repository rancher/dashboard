import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';

export class FleetGitRepoListPagePo extends BaseListPagePo {
  static url = '/c/_/fleet/fleet.cattle.io.gitrepo';

  constructor() {
    super(FleetGitRepoListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoListPagePo.url);
  }
}
