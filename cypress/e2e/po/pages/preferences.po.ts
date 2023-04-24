import PagePo from '~/cypress/e2e/po/pages/page.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ButtonGroupPo from '~/cypress/e2e/po/components/button-group.po';
import RadioGroupInputPo from '~/cypress/e2e/po/components/radio-group-input.po';
import ListBoxPo from '~/cypress/e2e/po/components/dropdown-listbox.po';
import DropBoxPo from '~/cypress/e2e/po/components/labeled-select.po';

export default class PreferencesPagePo extends PagePo {
  static url: string = '/prefs'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PreferencesPagePo.url);
  }

  constructor() {
    super(PreferencesPagePo.url);
  }

  title(): Cypress.Chainable {
    return this.self().get('h1').should('have.text', 'Preferences');
  }

  languageDropdownMenu(): DropBoxPo {
    return new DropBoxPo('[data-testid=prefs__languageSelector]');
  }

  dateFormateDropdownMenu(): DropBoxPo {
    return new DropBoxPo('[data-testid=prefs__displaySetting__dateFormat]');
  }

  timeFormateDropdownMenu(): DropBoxPo {
    return new DropBoxPo('[data-testid=prefs__displaySetting__timeFormat]');
  }

  perPageDropdownMenu(): DropBoxPo {
    return new DropBoxPo('[data-testid=prefs__displaySetting__perPage]');
  }

  clustersDropdownMenu(): DropBoxPo {
    return new DropBoxPo('[data-testid=prefs__displaySetting__menuMaxClusters]');
  }

  listBox(): ListBoxPo {
    return new ListBoxPo('.vs__dropdown-menu');
  }

  themeButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid=prefs__themeOptions]');
  }

  keymapButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid=prefs__keymapOptions]');
  }

  helmButtons(): ButtonGroupPo {
    return new ButtonGroupPo('[data-testid=prefs__helmOptions]');
  }

  scalingDownPromptCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid=prefs__scalingDownPrompt]');
  }

  viewInApiCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid=prefs__viewInApi]');
  }

  allNamespacesCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid=prefs__allNamespaces]');
  }

  themeShortcutCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid=prefs__themeShortcut]');
  }

  hideDescriptionsCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid=prefs__hideDescriptions]');
  }

  landingPageRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid=prefs__landingPagePreference]');
  }

  checkLangDomElement(label: string) {
    return cy.get(label).should('exist');
  }

  checkThemeDomElement(label: string) {
    return cy.get('html > body').should('have.class', label).and('exist');
  }
}
