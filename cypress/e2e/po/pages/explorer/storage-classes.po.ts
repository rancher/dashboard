import PagePo from '@/cypress/e2e/po/pages/page.po';
import StorageClassesCreateEditPo from '@/cypress/e2e/po/edit/storage-classes.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class StorageClassesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/storage.k8s.io.storageclass`;
  }

  urlPath(clusterId = 'local') {
    return StorageClassesPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(StorageClassesPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('StorageClasses');
  }

  constructor(clusterId = 'local') {
    super(StorageClassesPagePo.createPath(clusterId));
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

  createStorageClassesForm(id? : string): StorageClassesCreateEditPo {
    return new StorageClassesCreateEditPo(id);
  }
}
