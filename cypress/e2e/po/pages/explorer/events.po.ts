import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';

export class EventsPageListPo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/event`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(EventsPageListPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(EventsPageListPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Events');
  }
}

export class EventsCreateEditPo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, eventName?: string) {
    const root = `/c/${ clusterId }/explorer/event`;

    return namespace && eventName ? `${ root }/${ namespace }/${ eventName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, eventName?: string) {
    super(EventsCreateEditPo.createPath(clusterId, namespace, eventName));
  }
}
