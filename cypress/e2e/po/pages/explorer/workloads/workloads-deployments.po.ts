import { WorkloadsListPageBasePo, WorkloadsCreatePageBasePo, WorkloadDetailsPageBasePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import RedeployDialogPo from '@/cypress/e2e/po/components/workloads/redeploy-dialog.po';

type WorkloadType = 'workload' | 'pods' | 'apps.deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

export class WorkloadsDeploymentsDetailsPagePo extends WorkloadDetailsPageBasePo {
  constructor(workloadId: string, protected clusterId: string = 'local', workloadType = 'apps.deployment' as WorkloadType, namespaceId = 'default', queryParams?: Record<string, string>) {
    super(workloadId, clusterId, workloadType, queryParams, namespaceId);
  }

  openEmptyShowConfigurationAnnotationsLink() {
    return this.self().find('[data-testid="empty-show-configuration_annotations"]').click();
  }

  labelsAndAnnotationsTab() {
    return this.self().find('[data-testid="btn-labels"]');
  }
}

export class WorkloadsDeploymentsListPagePo extends WorkloadsListPageBasePo {
  constructor(protected clusterId: string = 'local', workloadType = 'apps.deployment' as WorkloadType, queryParams?: Record<string, string>) {
    super(clusterId, workloadType, queryParams);
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('Deployments');
  }

  redeployDialog(): RedeployDialogPo {
    return new RedeployDialogPo();
  }
}

export class WorkloadsDeploymentsCreatePagePo extends WorkloadsCreatePageBasePo {
  constructor(protected clusterId: string = 'local', workloadType = 'apps.deployment' as WorkloadType, queryParams?: Record<string, string>) {
    super(clusterId, workloadType, queryParams);
  }
}
