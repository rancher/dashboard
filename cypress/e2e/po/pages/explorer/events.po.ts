import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { EventsCreateEditPo } from '@/cypress/e2e/po/edit/events.po';

export class EventsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/event`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(EventsPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(EventsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Events');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  eventCreateEditPo(): EventsCreateEditPo {
    return new EventsCreateEditPo();
  }
}
