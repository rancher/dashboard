import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { WorkloadsCreatePageBasePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads.po';

type WorkloadType = 'workload' | 'pods' | 'apps.deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

export class WorkloadsPodsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/pod`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsPodsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsPodsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('Pods');
  }

  createPod() {
    return this.list().masthead().actions().eq(0)
      .click();
  }
}

export class WorkLoadsPodDetailsPagePo extends BaseDetailPagePo {
  static url: string;

  private static createPath(podId: string, clusterId: string, namespaceId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/pod/${ namespaceId }/${ podId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(podId: string, queryParams?: Record<string, string>, clusterId = 'local', namespaceId = 'default') {
    super(WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams));

    WorkLoadsPodDetailsPagePo.url = WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams);
  }
}
export class WorkloadsPodsCreatePagePo extends WorkloadsCreatePageBasePo {
  constructor(protected clusterId: string = 'local', workloadType = 'pod' as WorkloadType, queryParams?: Record<string, string>) {
    super(clusterId, workloadType, queryParams);
  }
}
export class WorkLoadsPodEditPagePo extends BaseDetailPagePo {
  private static createPath(podId: string, clusterId: string, namespaceId: string) {
    return `/c/${ clusterId }/explorer/pod/${ namespaceId }/${ podId }`;
  }

  urlPath(podId: string, clusterId = 'local', namespaceId = 'default') {
    return WorkLoadsPodEditPagePo.createPath(podId, clusterId, namespaceId);
  }

  goToPodEditPage(podId: string, clusterId: string, namespaceId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkLoadsPodEditPagePo.createPath(podId, clusterId, namespaceId));
  }

  constructor(podId: string, clusterId = 'local', namespaceId = 'default') {
    super(WorkLoadsPodEditPagePo.createPath(podId, clusterId, namespaceId));
  }
}
