import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { navToWorkloadTypeViaSideMenu } from '@/cypress/e2e/po/side-bars/workload-side-nav';
import RedeployDialogPo from '@/cypress/e2e/po/components/workloads/redeploy-dialog.po';

export class WorkloadsStatefulSetsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apps.statefulset`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsStatefulSetsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsStatefulSetsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    navToWorkloadTypeViaSideMenu(clusterId, 'StatefulSets');
  }

  redeployDialog(): RedeployDialogPo {
    return new RedeployDialogPo();
  }
}
