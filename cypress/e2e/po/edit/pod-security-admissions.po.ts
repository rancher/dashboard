import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
export default class PodSecurityAdmissionsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/manager/management.cattle.io.podsecurityadmissionconfigurationtemplate`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', id?: string) {
    super(PodSecurityAdmissionsCreateEditPo.createPath(clusterId, id));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }
}
