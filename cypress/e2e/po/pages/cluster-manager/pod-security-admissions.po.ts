import PagePo from '@/cypress/e2e/po/pages/page.po';
import PodSecurityAdmissionsCreateEditPo from '@/cypress/e2e/po/edit/pod-security-admissions.po';
import PodSecurityAdmissionListPo from '@/cypress/e2e/po/lists/pod-security-admissions-list.po';

export default class PodSecurityAdmissionsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/management.cattle.io.podsecurityadmissionconfigurationtemplate`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PodSecurityAdmissionsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(PodSecurityAdmissionsPagePo.createPath(clusterId));
  }

  create() {
    return cy.getId('masthead-create').click();
  }

  createPodSecurityAdmissionForm(id? : string): PodSecurityAdmissionsCreateEditPo {
    return new PodSecurityAdmissionsCreateEditPo(this.clusterId, id);
  }

  list(): PodSecurityAdmissionListPo {
    return new PodSecurityAdmissionListPo('[data-testid="cluster-list-container"]');
  }
}
