import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { HeaderPo } from '~/cypress/e2e/po/components/header.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import WorkloadsCreateEditPo from '@/cypress/e2e/po/edit/workloads.po';
export default class WorkloadPagePo extends PagePo {
  static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/workload`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadPagePo.createPath(clusterId));
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  kubectl() {
    return new Kubectl();
  }

  deleteWithKubectl(name: string, namespace = 'default') {
    this.kubectl()
      .openTerminal()
      .executeCommand(`delete deployment ${ name } -n ${ namespace }`);
  }

  createWithKubectl(blueprints: string | Object, wait = 6000, timeout) {
    this.kubectl()
      .openTerminal(timeout)
      .executeMultilineCommand(blueprints, wait);
  }

  actionsHeader() {
    return new HeaderPo();
  }

  clickCreate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().create();
  }

  createWorkloadsForm(id? : string): WorkloadsCreateEditPo {
    return new WorkloadsCreateEditPo(id);
  }
}
