import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ModalWithCardPo from '@/cypress/e2e/po/components/modal-with-card.po';
import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import GenericPrompt from '@/cypress/e2e/po/prompts/genericPrompt.po';

export class PerformancePagePo extends RootClusterPage {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/settings/performance`;
  }

  static modal = new ModalWithCardPo();
  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PerformancePagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(PerformancePagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
    sideNav.navToSideMenuEntryByLabel('Performance');
  }

  incompatibleModal(): GenericPrompt {
    return new GenericPrompt('.prompt-restore');
  }

  inactivityCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable inactivity session expiration ');
  }

  inactivityInput() {
    return LabeledInputPo.byLabel(this.self(), 'Inactivity timeout (minutes) ');
  }

  inactivityModalCard() {
    return new ModalWithCardPo();
  }

  websocketCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Disable websocket notifications');
  }

  incrementalLoadingCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable incremental loading');
  }

  manualRefreshCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable manual refresh of data for lists');
  }

  garbageCollectionCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Garbage Collection');
  }

  garbageCollectionResourceCount() {
    return LabeledInputPo.byLabel(this.self(), 'Resource Count');
  }

  namespaceFilteringCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Required Namespace / Project Filtering');
  }

  websocketWebWorkerCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Advanced Websocket Web Worker ');
  }

  serverSidePaginationCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Server-side Pagination ');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="performance__save-btn"]', this.self());
  }

  applyAndWait(context: string, endpoint = 'ui-performance', statusCode?: number): Cypress.Chainable {
    cy.intercept('PUT', endpoint).as(context);
    this.applyButton().click();

    return statusCode ? cy.wait(`@${ context }`).its('response.statusCode').should('eq', statusCode) : cy.wait(`@${ context }`);
  }

  restoresInactivitySettings() {
    this.inactivityInput().clear().type('900');
    this.inactivityCheckbox().set();
    this.applyAndWait('reset-inactivity', undefined, 200);
  }
}
