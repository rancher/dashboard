import AsyncButtonPo from '~/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ColorInputPo from '~/cypress/e2e/po/components/color-input.po';
import LabeledInputPo from '~/cypress/e2e/po/components/labeled-input.po';
import RootClusterPage from '~/cypress/e2e/po/pages/root-cluster-page';

export class BrandingPagePo extends RootClusterPage {
  static url: string = '/c/_/settings/brand';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(BrandingPagePo.url);
  }

  constructor() {
    super(BrandingPagePo.url);
  }

  privateLabel(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Private Label');
  }

  supportLinksLabel(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Issue Reporting URL');
  }

  customLogoCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Logo');
  }

  primaryColorCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Color');
  }

  primaryColorPicker() {
    return new ColorInputPo('[data-testid="primary-color-input"]');
  }

  linkColorCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Link Color');
  }

  linkColorPicker() {
    return new ColorInputPo('[data-testid="link-color-input"]');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="branding-apply-async-button"]', this.self());
  }
}
