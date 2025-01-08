import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
export default class FleetClusterGroupsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, workspace?: string, id?: string ) {
    const root = `/c/${ clusterId }/fleet/fleet.cattle.io.clustergroup`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', workspace?: string, id?: string) {
    super(FleetClusterGroupsCreateEditPo.createPath(clusterId, workspace, id));
  }

  title() {
    return this.self().get('.title .primaryheader  h1');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }

  saveButton() {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
