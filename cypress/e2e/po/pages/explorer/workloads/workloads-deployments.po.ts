import { WorkloadsListPageBasePo, WorkloadsCreatePageBasePo, workloadDetailsPageBasePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads.po';

export class WorkloadsDeploymentsDetailsPagePo extends workloadDetailsPageBasePo {
  constructor(workloadId: string, protected clusterId: string = 'local', workloadType = 'apps.deployment', namespaceId = 'default', queryParams?: Record<string, string>) {
    super(workloadId, clusterId, workloadType, queryParams, namespaceId);
  }
}

export class WorkloadsDeploymentsListPagePo extends WorkloadsListPageBasePo {
  constructor(protected clusterId: string = 'local', workloadType = 'apps.deployment', queryParams?: Record<string, string>) {
    super(clusterId, workloadType, queryParams);
  }
}

export class WorkloadsDeploymentsCreatePagePo extends WorkloadsCreatePageBasePo {
  constructor(protected clusterId: string = 'local', workloadType = 'apps.deployment', queryParams?: Record<string, string>) {
    super(clusterId, workloadType, queryParams);
  }
}
