import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Covers core functionality that's common to the dashboard's import cluster pages
 */
export default class ClusterManagerImportPagePo extends ClusterManagerCreateImportPagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster/create'

  constructor() {
    super(ClusterManagerImportPagePo.url);
  }

  selectKubeProvider(index: number) {
    return this.resourceDetail().cruResource().selectSubType(0, index).click();
  }

  selectGeneric(index: number) {
    return this.resourceDetail().cruResource().selectSubType(1, index).click();
  }
}
