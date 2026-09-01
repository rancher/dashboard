import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ColorInputPo from '@/cypress/e2e/po/components/color-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class BrandingPagePo extends RootClusterPage {
  static url = '/c/_/settings/brand';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(BrandingPagePo.url);
  }

  constructor() {
    super(BrandingPagePo.url);
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
    sideNav.navToSideMenuEntryByLabel('Branding');
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

  customBannerCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Banner');
  }

  customLoginBackgroundCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Background');
  }

  customFaviconCheckbox(): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), 'Use a Custom Favicon');
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

  uploadButton(label: string) {
    return cy.getId('file-selector__uploader-button').contains(label).next('input');
  }

  logoPreview(theme: string) {
    return cy.getId(`branding-logo-${ theme }-preview`);
  }

  bannerPreview(theme: string) {
    return cy.getId(`branding-banner-${ theme }-preview`);
  }

  loginBackgroundPreview(theme: string) {
    return cy.getId(`branding-login-background-${ theme }-preview`);
  }

  faviconPreview() {
    return cy.getId('branding-favicon-preview');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="branding-apply-async-button"]', this.self());
  }

  applyAndWait(endpoint: string, statusCode?: number): Cypress.Chainable {
    cy.intercept('PUT', endpoint).as(endpoint);
    this.applyButton().click();

    return statusCode ? cy.wait(`@${ endpoint }`).its('response.statusCode').should('eq', statusCode) : cy.wait(`@${ endpoint }`);
  }
}
