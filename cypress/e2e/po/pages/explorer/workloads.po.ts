import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';

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

  createWithKubectl(blueprints: string | Object, wait = 6000) {
    this.kubectl()
      .openTerminal()
      .executeMultilineCommand(blueprints, wait);
  }
}
