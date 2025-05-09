import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';

export class EventsCreateEditPo extends PagePo {
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

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }
}
