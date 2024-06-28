import PagePo from '@/cypress/e2e/po/pages/page.po';
import MgmtUsersListPo from '@/cypress/e2e/po/lists/management.cattle.io.user.po';
import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';
import MgmtUserResourceDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.user.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import LinkPo from '@/cypress/e2e/po/components/link.po';

export default class UsersPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/management.cattle.io.user`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  static navTo(): Cypress.Chainable<Cypress.AUTWindow> {
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Users & Authentication');
    const sideNav = new ProductNavPo();

    return sideNav.navToSideMenuEntryByLabel('Users');
  }

  constructor(private clusterId = '_') {
    super(UsersPo.createPath(clusterId));
  }

  waitForRequests() {
    UsersPo.goToAndWaitForGet(this.goTo.bind(this), ['/v3/users?limit=0'], 15000);
  }

  list() {
    return new MgmtUsersListPo(this.self());
  }

  createEdit(userId?: string) {
    return new MgmtUserEditPo(this.clusterId, userId);
  }

  detail(userId: string) {
    return new MgmtUserResourceDetailPo(this.clusterId, userId);
  }

  userRetentionLink() {
    return new LinkPo('[data-testid="router-link-user-retention"]', this.self());
  }
}
