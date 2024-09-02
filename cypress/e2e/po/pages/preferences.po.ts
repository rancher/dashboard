import PagePo from '@/cypress/e2e/po/pages/page.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ButtonGroupPo from '@/cypress/e2e/po/components/button-group.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

export default class PreferencesPagePo extends PagePo {
  static url = '/prefs'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PreferencesPagePo.url);
  }

  constructor() {
    super(PreferencesPagePo.url);
  }

  static navTo() {
    const userMenu = new UserMenuPo();

    userMenu.clickMenuItem('Preferences');
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('have.text', 'Preferences');
  }

  languageDropdownMenu(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="prefs__languageSelector"]');
  }

  dateFormateDropdownMenu(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="prefs__displaySetting__dateFormat"]');
  }

  timeFormateDropdownMenu(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="prefs__displaySetting__timeFormat"]');
  }

  perPageDropdownMenu(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="prefs__displaySetting__perPage"]');
  }

  clustersDropdownMenu(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="prefs__displaySetting__menuMaxClusters"]');
  }

  themeButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid="prefs__themeOptions"]');
  }

  keymapButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid="prefs__keymapOptions"]');
  }

  helmButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid="prefs__helmOptions"]');
  }

  scalingDownPromptCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="prefs__scalingDownPrompt"]');
  }

  viewInApiCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="prefs__viewInApi"]');
  }

  allNamespacesCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="prefs__allNamespaces"]');
  }

  themeShortcutCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="prefs__themeShortcut"]');
  }

  hideDescriptionsCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="prefs__hideDescriptions"]');
  }

  verifyHideDescriptionsCheckboxLabel() {
    return this.hideDescriptionsCheckbox().getCheckboxLabel().should('equal', 'Hide Type Description banners above resource lists ');
  }

  landingPageRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="prefs__landingPagePreference"]');
  }

  checkLangDomElement(label: string) {
    return cy.get(label).should('exist');
  }
}
