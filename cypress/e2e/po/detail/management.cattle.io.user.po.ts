import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';

class MgmtUserResourceDetailComponentPo extends ResourceDetailPo {
  userCreateEditView(clusterId: string, userId?: string ) {
    return new MgmtUserEditPo(clusterId, userId);
  }
}

export default class MgmtUserResourceDetailPo extends PagePo {
  private static createPath(clusterId: string, userId: string ) {
    return `/c/${ clusterId }/auth/management.cattle.io.user/${ userId }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string, userId: string) {
    super(MgmtUserResourceDetailPo.createPath(clusterId, userId));
  }

  detail() {
    return new MgmtUserResourceDetailComponentPo(this.self());
  }
}
