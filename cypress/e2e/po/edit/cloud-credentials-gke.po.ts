import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ButtonFileSelectorPo from '@/cypress/e2e/po/components/button-file-selector.po';
import BaseCloudCredentialsPo from '@/cypress/e2e/po/edit/base-cloud-credentials.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class GKECloudCredentialsCreateEditPo extends BaseCloudCredentialsPo {
  serviceAccount(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Service Account');
  }

  readFromFile(): Cypress.Chainable {
    return ButtonFileSelectorPo.readFromFileButton().click();
  }

  authenticateButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }
}
