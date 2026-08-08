import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import TabbedPo from '~/cypress/e2e/po/components/tabbed.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '~/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '~/cypress/e2e/po/components/labeled-select.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export class InstallChartPage extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/charts/install`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(InstallChartPage.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(InstallChartPage.createPath(clusterId));
  }

  waitForChartPage(repository: string, chart: string) {
    return this.waitForPage(`repo-type=cluster&repo=${ repository }&chart=${ chart }`);
  }

  nextPage() {
    const btn = new AsyncButtonPo('.controls-steps .btn.variant-primary');

    btn.click(true);

    return this;
  }

  editOptions(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  selectTab(options: TabbedPo, tabID: string) {
    return this.editOptions(options, `[data-testid="btn-${ tabID }"]`);
  }

  installChart() {
    // Use the same pattern as nextPage() but target the finish/install button specifically
    // The install button is in the controls-steps area and is the async button for the final step
    const selector = '.controls-steps [data-testid="action-button-async-button"]';

    // The wizard's finish/install button is `:disabled="!activeStep.ready"`, so it
    // stays disabled until the step's schema/validation has finished loading.
    // Force-clicking it while still disabled lands the click but never emits the
    // `finish` handler, so no install request is sent and a downstream
    // `cy.wait('@chartInstall')` reports "no request ever occurred". Wait (up to
    // 30s under CI load) for the button to be enabled before clicking.
    cy.get(selector, MEDIUM_TIMEOUT_OPT).should('not.have.attr', 'disabled');

    const btn = new AsyncButtonPo(selector);

    btn.self().scrollIntoView();
    btn.click(true);

    return this;
  }

  editYaml() {
    this.self().get('[data-testid="btn-group-options-view"]').contains('Edit YAML').click();

    return this;
  }

  footerControls() {
    return cy.get('#wizard-footer-controls');
  }

  chartName() {
    return this.self().get('[data-testid="NameNsDescriptionNameInput"]');
  }

  chartNameLink() {
    return this.self().get('[data-testid="chart-install-name-link"]');
  }

  chartVersionSelector(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="chart-version-selector"]');
  }

  customRegistryCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="custom-registry-checkbox"]');
  }

  customRegistryInput(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="custom-registry-input"]');
  }
}
