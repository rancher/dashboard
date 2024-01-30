import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ColorInputPo from '@/cypress/e2e/po/components/color-input.po';
import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export class BannersPagePo extends RootClusterPage {
  static url = '/c/_/settings/banners';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(BannersPagePo.url);
  }

  constructor() {
    super(BannersPagePo.url);
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
    sideNav.navToSideMenuEntryByLabel('Banners');
  }

  // input
  headerInput(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('text-area-auto-grow').eq(0));
  }

  footerInput(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('text-area-auto-grow').eq(1));
  }

  loginScreenInput(): LabeledInputPo {
    return new LabeledInputPo(cy.getId('text-area-auto-grow').eq(2));
  }

  loginErrorInput(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Text to display');
  }

  // checkboxes
  headerBannerCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Show Banner in Header');
  }

  footerBannerCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Show Banner in Footer');
  }

  loginScreenBannerCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Show Consent Banner on Login Screen');
  }

  loginErrorCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Show custom login error');
  }

  /**
   * Get text alignment radio buttons
   * @param bannerType
   * @returns
   */
  textAlignmentRadioGroup(bannerType: string) {
    return new RadioGroupInputPo(`[data-testid="banner_alignment_radio_options${ bannerType }"]`, this.self());
  }

  /**
   * Get text decoration checkboxes
   * @param bannerType
   * @param label
   * @returns
   */
  textDecorationCheckboxes(bannerType: 'bannerHeader' | 'bannerFooter' | 'bannerConsent', label: 'Bold' | 'Italic' | 'Underline') {
    return new CheckboxInputPo(`[data-testid="banner_decoration_checkbox${ bannerType }${ label }"]`, this.self());
  }

  /**
   * Select font size by label
   * @param bannerType
   * @param label
   */
  selectFontSizeByValue(bannerType: 'bannerHeader' | 'bannerFooter' | 'bannerConsent', label: string) {
    const selectFontSize = new LabeledSelectPo(`[data-testid="banner_font_size_options${ bannerType }"]`, this.self());

    selectFontSize.toggle();
    selectFontSize.clickOptionWithLabel(label);
  }

  /**
   * Get text color picker by index
   * @param index
   * @returns
   */
  textColorPicker(index: number): ColorInputPo {
    return new ColorInputPo(cy.getId('color-input-color-input').eq(index));
  }

  /**
   * Get banner
   * @returns
   */
  banner(): Cypress.Chainable {
    return cy.getId('fixed__banner');
  }

  /**
   * Get apply button
   * @returns
   */
  applyButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  /**
   * Click apply button
   * @param endpoint
   * @returns
   */
  applyAndWait(endpoint: string, statusCode?: number): Cypress.Chainable {
    cy.intercept('PUT', endpoint).as(endpoint);
    this.applyButton().click();

    return statusCode ? cy.wait(`@${ endpoint }`).its('response.statusCode').should('eq', statusCode) : cy.wait(`@${ endpoint }`);
  }
}
