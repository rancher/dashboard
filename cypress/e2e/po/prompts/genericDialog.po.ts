import DialogPo from '@/cypress/e2e/po/components/dialog.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class GenericDialog extends ComponentPo {
  private dialog: DialogPo;

  constructor(selector = '#modal-container-element') {
    super(selector);
    this.dialog = new DialogPo(selector);
  }

  labeledSelect(selector = '.labeled-select'): LabeledSelectPo {
    return new LabeledSelectPo(selector);
  }

  clickActionButton(text: string) {
    return this.dialog.getActionButton().contains(text).click();
  }
}
