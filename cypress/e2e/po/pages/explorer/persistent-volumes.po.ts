import PagePo from '@/cypress/e2e/po/pages/page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
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

  /**
   * The Claim column also links to a detail page, so pick the link by the volume's name
   */
  goToDetailsPage(name: string) {
    return this.list().resourceTable().sortableTable().detailsPageLinkWithName(name)
      .contains(name)
      .click();
  }

  createPersistentVolumesForm(id? : string): PersistentVolumesCreateEditPo {
    return new PersistentVolumesCreateEditPo(id);
  }
}

export class PersistentVolumeDetailPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, name: string) {
    return `/c/${ clusterId }/explorer/persistentvolume/${ name }`;
  }

  constructor(name: string, clusterId = 'local') {
    super(PersistentVolumeDetailPagePo.createPath(clusterId, name));
  }

  mastheadDetail(name: 'source' | 'capacity' | 'reclaim-policy' | 'storage-class' | 'access-modes') {
    return this.resourceDetail().masthead().self().find(`[data-testid="pv-detail-${ name }"]`);
  }

  clickClaimsTab() {
    return this.resourceDetail().tabs().clickTabWithName('volume-claim');
  }

  claimsTabPanel() {
    return this.self().find('[data-testid="tab-panel-volume-claim"]');
  }

  claimsList() {
    return this.resourceDetail().tabbedList('volume-claim');
  }
}
