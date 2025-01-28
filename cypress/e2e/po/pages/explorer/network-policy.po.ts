import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import CreateEditNetworkPolicyPagePo from '@/cypress/e2e/po/edit/policy/network-policy.po';

export class NetworkPolicyPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/networking.k8s.io.networkpolicy`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NetworkPolicyPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Policy');
    sideNav.navToSideMenuEntryByLabel('Network Policies');
  }

  constructor(private clusterId = 'local') {
    super(NetworkPolicyPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }

  listElementWithName(name:string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }

  searchForNetworkPolicy(name: string) {
    return this.list().resourceTable().sortableTable().filter(name);
  }

  createEditNetworkPolicyForm(namespace?: string, id?: string): CreateEditNetworkPolicyPagePo {
    return new CreateEditNetworkPolicyPagePo(this.clusterId, namespace, id);
  }
}
