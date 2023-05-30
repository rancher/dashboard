import PagePo from '@/cypress/e2e/po/pages/page.po';

export class WorkloadsPodsListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/pod`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsPodsListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string = 'local') {
    super(WorkloadsPodsListPagePo.createPath(clusterId));
  }
}

export class WorkLoadsPodDetailsPagePo extends PagePo {
  static url: string;

  private static createPath(podId: string, clusterId: string, namespaceId: string, queryParams?: { [key: string]: string }) {
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

  constructor(podId: string, queryParams?: { [key: string]: string }, clusterId: string = 'local', namespaceId: string = 'default') {
    super(WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams));

    WorkLoadsPodDetailsPagePo.url = WorkLoadsPodDetailsPagePo.createPath(podId, clusterId, namespaceId, queryParams);
  }
}
