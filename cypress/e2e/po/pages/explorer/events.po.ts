import PagePo from '@/cypress/e2e/po/pages/page.po';
import EventsListPo from '@/cypress/e2e/po/lists/events-list.po';

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

  eventslist(): EventsListPo {
    return new EventsListPo('[data-testid="sortable-table-list-container"]');
  }
}
