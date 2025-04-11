import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

export default class FleetWorkspaceCreateEditPo extends PagePo {
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

  title() {
    return this.self().get('.title .primaryheader  h1');
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  tabs() {
    return new TabbedPo('[data-testid="tabbed"]');
  }

  allowTargetNsTab() {
    return this.tabs().clickTabWithSelector('[data-testid="btn-allowedtargetnamespaces"]');
  }

  allowTargetNsTabList() {
    return new ArrayListPo('section#allowedtargetnamespaces');
  }

  lablesAnnotationsTab() {
    return this.tabs().clickTabWithSelector('[data-testid="btn-labels"]');
  }

  lablesAnnotationsKeyValue() {
    return new KeyValuePo('section#labels');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }

  saveButton() {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
