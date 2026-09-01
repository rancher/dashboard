import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import PersistentVolumesCreateEditPo from '@/cypress/e2e/po/edit/persistent-volumes.po';

export class PersistentVolumesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/persistentvolume`;
  }

  urlPath(clusterId = 'local') {
    return PersistentVolumesPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PersistentVolumesPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('PersistentVolumes');
  }

  constructor(clusterId = 'local') {
    super(PersistentVolumesPagePo.createPath(clusterId));
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

  createPersistentVolumesForm(id? : string): PersistentVolumesCreateEditPo {
    return new PersistentVolumesCreateEditPo(id);
  }
}
