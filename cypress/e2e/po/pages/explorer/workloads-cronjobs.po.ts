import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '~/cypress/e2e/po/pages/base/base-detail-page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class WorkloadsCronJobsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/batch.cronjob`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsCronJobsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsCronJobsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('CronJobs');
  }

  /**
   * Open the action (ellipsis) menu for the given CronJob row and click the 'Run Now' item
   */
  runNow(name: string) {
    return this.list().resourceTable().sortableTable()
      .rowActionMenuOpen(name)
      .getMenuItem('Run Now')
      .click();
  }
}

export class WorkloadsCronJobDetailPagePo extends BaseDetailPagePo {
  private static createPath(cronJobId: string, clusterId: string, namespaceId: string) {
    return `/c/${ clusterId }/explorer/batch.cronjob/${ namespaceId }/${ cronJobId }`;
  }

  constructor(cronJobId: string, clusterId = 'local', namespaceId = 'default') {
    super(WorkloadsCronJobDetailPagePo.createPath(cronJobId, clusterId, namespaceId));
  }
}
