import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import CustomResourceDefinitionsCreateEditPo from '@/cypress/e2e/po/edit/custom-resource-definitions.po';

export class CustomResourceDefinitionsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apiextensions.k8s.io.customresourcedefinition`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CustomResourceDefinitionsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(CustomResourceDefinitionsPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('More Resources');
    sideNav.navToSideMenuGroupByLabel('API');
    sideNav.navToSideMenuEntryByLabel('CustomResourceDefinitions');
  }

  create() {
    return this.list().masthead().actions().contains('Create from YAML')
      .click();
  }

  crdCreateEditPo(): CustomResourceDefinitionsCreateEditPo {
    return new CustomResourceDefinitionsCreateEditPo(this.clusterId);
  }

  list() {
    return new BaseResourceList(this.self());
  }

  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
