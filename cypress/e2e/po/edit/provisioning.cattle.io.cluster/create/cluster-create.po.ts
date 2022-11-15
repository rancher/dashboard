import ToggleSwitchPo from '@/cypress/e2e/po/components/toggle-switch.po';
import ClusterManagerCreateImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

/**
 * Covers core functionality that's common to the dashboard's create cluster pages
 */
export default abstract class ClusterManagerCreatePagePo extends ClusterManagerCreateImportPagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster/create'

  constructor() {
    super(ClusterManagerCreatePagePo.url);
  }

  rkeToggle() {
    return new ToggleSwitchPo(this.self().find('.toggle-container'));
  }

  selectKubeProvider(index: number) {
    return this.resourceDetail().cruResource().selectSubType(0, index).click();
  }

  selectCreate(index: number) {
    return this.resourceDetail().cruResource().selectSubType(1, index).click();
  }

  selectCustom(index: number) {
    return this.resourceDetail().cruResource().selectSubType(2, index).click();
  }
}
