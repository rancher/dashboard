import DialogPo from '@/cypress/e2e/po/components/dialog.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class GenericDialog extends ComponentPo {
  constructor(selector = '#modal-container-element') {
    super(selector);
  }

  dialog(): DialogPo {
    return new DialogPo(this.selector);
  }

  labeledSelect(selector = '.labeled-select'): LabeledSelectPo {
    return new LabeledSelectPo(selector);
  }

  clickActionButton(text: string) {
    return this.dialog().getActionButton().contains(text).click();
  }

  cancelIfOpen() {
    cy.get('body').then(($body) => {
      const found = $body.find(this.selector);

      if (found.length) {
        this.clickActionButton('Cancel');
      }
    });
  }
}
