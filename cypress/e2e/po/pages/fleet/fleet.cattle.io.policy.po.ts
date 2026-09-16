import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export type PolicyVariant = 'git-repo' | 'helm-op';

export class FleetPolicyListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/fleet.cattle.io.policy`;

  constructor() {
    super(FleetPolicyListPagePo.url);
  }

  /**
   * The Fleet Policy entry within the product side nav "Resources" group.
   * Located by its resource href so the test doesn't depend on the (backend derived) nav label.
   */
  static navEntry(): Cypress.Chainable {
    const sideNav = new ProductNavPo();

    return sideNav.self().find(`a[href$="${ FleetPolicyListPagePo.url }"]`);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');

    return FleetPolicyListPagePo.navEntry().click();
  }
}

export class FleetPolicyCreateEditPo extends BaseDetailPagePo {
  private static createPath(workspace?: string, id?: string) {
    const root = FleetPolicyListPagePo.url;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(workspace?: string, id?: string) {
    super(FleetPolicyCreateEditPo.createPath(workspace, id));
  }

  nameNsDescription(): NameNsDescription {
    return new NameNsDescription('[data-testid="fleet-policy-name-ns-description"]');
  }

  requireServiceAccount(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="fleet-policy-require-service-account"]');
  }

  allowNamespaceCreation(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="fleet-policy-allow-namespace-creation"]');
  }

  restrictServiceAccounts(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="fleet-policy-restrict-service-accounts"]');
  }

  allowedServiceAccounts(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-policy-allowed-service-accounts"]');
  }

  defaultServiceAccount(variant: PolicyVariant): LabeledSelectPo {
    return new LabeledSelectPo(`[data-testid="fleet-policy-${ variant }-default-service-account"]`);
  }

  defaultSecret(variant: PolicyVariant): LabeledSelectPo {
    return new LabeledSelectPo(`[data-testid="fleet-policy-${ variant }-default-secret"]`);
  }

  restrictSecrets(variant: PolicyVariant): RadioGroupInputPo {
    return new RadioGroupInputPo(`[data-testid="fleet-policy-${ variant }-restrict-secrets"]`);
  }

  allowedSecrets(variant: PolicyVariant): LabeledSelectPo {
    return new LabeledSelectPo(`[data-testid="fleet-policy-${ variant }-allowed-secrets"]`);
  }

  /**
   * The name fields are taggable selects, so a name that does not exist in the workspace yet is
   * typed and then picked from the option the select creates for it. The dropdown is rendered
   * outside the select, and only one is open at a time.
   */
  enterName(select: LabeledSelectPo, name: string) {
    // Clicking opens the dropdown - typing on its own leaves it closed and nothing is committed
    select.self().find('input.vs__search').click().type(name);
    cy.get('.vs__dropdown-menu').contains('li', name).click();
    select.self().find('.vs__selected').should('contain.text', name);
  }
}
