import MgmtUsersListPo from '@/cypress/e2e/po/lists/management.cattle.io.user.po';
import MgmtUserEditPo from '@/cypress/e2e/po/edit/management.cattle.io.user.po';
import MgmtUserResourceDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.user.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import LinkPo from '@/cypress/e2e/po/components/link.po';
import ClusterPage from '@/cypress/e2e/po/pages/cluster-page.po';

export default class UsersPo extends ClusterPage {
  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  static navTo(): Cypress.Chainable<Cypress.AUTWindow> {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');

    return sideNav.navToSideMenuEntryByLabel('Users');
  }

  constructor(private clusterId = '_') {
    super(clusterId, 'auth/management.cattle.io.user');
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
