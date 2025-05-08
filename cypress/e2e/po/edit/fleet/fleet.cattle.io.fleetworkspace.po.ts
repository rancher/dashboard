import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

export default class FleetWorkspaceCreateEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string) {
    const root = '/c/_/fleet/management.cattle.io.fleetworkspace';

    return fleetWorkspace ? `${ root }/${ fleetWorkspace }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string) {
    super(FleetWorkspaceCreateEditPo.createPath(fleetWorkspace));
  }

  allowTargetNsTabList() {
    return new ArrayListPo('section#allowedtargetnamespaces');
  }

  lablesAnnotationsKeyValue() {
    return new KeyValuePo('section#labels');
  }
}
