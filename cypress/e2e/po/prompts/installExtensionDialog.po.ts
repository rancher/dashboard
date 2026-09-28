import DialogPo from '@/cypress/e2e/po/components/dialog.po';
import AsyncButtonPo from '~/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '~/cypress/e2e/po/components/labeled-select.po';

export default class InstallExtensionDialog extends DialogPo {
  public versionLabelSelect() {
    return new LabeledSelectPo(this.self().getId('install-ext-modal-select-version'));
  }

  selectVersionLabel(label: string): Cypress.Chainable {
    const selectVersion = this.versionLabelSelect();

    selectVersion.toggle();

    return selectVersion.setOptionAndClick(label);
  }

  selectVersionClick(optionIndex: number, toggle = true): Cypress.Chainable {
    const selectVersion = this.versionLabelSelect();

    if (toggle) {
      selectVersion.toggle();
    }

    return selectVersion.clickOption(optionIndex);
  }

  cancelButton() {
    return this.self().getId('install-ext-modal-cancel-btn');
  }

  installButton() {
    return new AsyncButtonPo(this.self().getId('install-ext-modal-install-btn'));
  }
}
