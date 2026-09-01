import PagePo from '@/cypress/e2e/po/pages/page.po';
import PodSecurityAdmissionsCreateEditPo from '@/cypress/e2e/po/edit/pod-security-admissions.po';
import PodSecurityAdmissionListPo from '@/cypress/e2e/po/lists/pod-security-admissions-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
export default class PodSecurityAdmissionsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/management.cattle.io.podsecurityadmissionconfigurationtemplate`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PodSecurityAdmissionsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(PodSecurityAdmissionsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('Pod Security Admissions');
  }

  create() {
    return this.list().masthead().actions().contains('Create')
      .click();
  }

  createPodSecurityAdmissionForm(id? : string): PodSecurityAdmissionsCreateEditPo {
    return new PodSecurityAdmissionsCreateEditPo(this.clusterId, id);
  }

  list(): PodSecurityAdmissionListPo {
    return new PodSecurityAdmissionListPo('[data-testid="sortable-table-list-container"]');
  }
}
