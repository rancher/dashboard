import GlobalRoleDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.globalrole.po';
import RoleTemplateDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.roletemplate.po';
import GlobalRoleEditPo from '@/cypress/e2e/po/edit/management.cattle.io.globalrole.po';
import RoleTemplateEditPo from '@/cypress/e2e/po/edit/management.cattle.io.roletemplate.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import RoleListPo from '@/cypress/e2e/po/lists/role-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ClusterPage from '@/cypress/e2e/po/pages/cluster-page.po';
import PaginationPo from '~/cypress/e2e/po/components/pagination.po';

export default class RolesPo extends ClusterPage {
  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(private clusterId = '_') {
    super(clusterId, 'auth/roles');
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Role Templates');
  }

  waitForRequests() {
    RolesPo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/management.cattle.io.roletemplates?exclude=metadata.managedFields']);
  }

  createGlobal(userId?: string) {
    return new GlobalRoleEditPo(this.clusterId, userId);
  }

  detailGlobal(roleId: string) {
    return new GlobalRoleDetailPo(this.clusterId, roleId);
  }

  goToEditYamlPage(elemName: string) {
    return this.list('GLOBAL').actionMenu(elemName).getMenuItem('Edit YAML').click();
  }

  createRole(userId?: string) {
    return new RoleTemplateEditPo(this.clusterId, userId);
  }

  detailRole(roleId: string) {
    return new RoleTemplateDetailPo(this.clusterId, roleId);
  }

  listCreate(label: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().contains(label)
      .click();
  }

  /**
   * resource list per tab
   * @param tabIdSelector
   * @returns
   */
  list(tabIdSelector: 'GLOBAL' | 'CLUSTER' | 'NAMESPACE') {
    return new RoleListPo(`#${ tabIdSelector } [data-testid="sortable-table-list-container"]`);
  }

  paginatedTab(tabIdSelector: 'GLOBAL' | 'CLUSTER' | 'NAMESPACE') {
    return new PaginationPo(`#${ tabIdSelector } div.paging`);
  }
}
