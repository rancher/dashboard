import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

export default class IngressEditPagePo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/networking.k8s.io.ingress`;

    return id ? `${ root }/${ id }?mode=edit` : `${ root }/create`;
  }

  goTo(clusterId: string, id?: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(IngressEditPagePo.createPath(clusterId, id));
  }

  constructor(clusterId = 'local', id?: string) {
    super(IngressEditPagePo.createPath(clusterId, id));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
