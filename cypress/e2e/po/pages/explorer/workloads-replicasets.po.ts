import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export class WorkloadsReplicasetsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apps.replicaset`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsReplicasetsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsReplicasetsListPagePo.createPath(clusterId));
  }
}

export class WorkloadsReplicasetsEditPagePo extends BaseDetailPagePo {
  static url: string;

  private static createPath(daemonsetId: string, clusterId: string, namespaceId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/apps.replicaset/${ namespaceId }/${ daemonsetId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(daemonsetId: string, queryParams?: Record<string, string>, clusterId = 'local', namespaceId = 'default') {
    super(WorkloadsReplicasetsEditPagePo.createPath(daemonsetId, clusterId, namespaceId, queryParams));

    WorkloadsReplicasetsEditPagePo.url = WorkloadsReplicasetsEditPagePo.createPath(daemonsetId, clusterId, namespaceId, queryParams);
  }

  containerImageInput(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Container Image');
  }
}
