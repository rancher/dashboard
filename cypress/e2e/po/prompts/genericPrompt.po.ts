import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class GenericPrompt extends ComponentPo {
  card = new CardPo();

  getTitle() {
    return this.card.getTitle();
  }

  getBody() {
    return this.card.getBody();
  }

  labeledSelect(selector = '.labeled-select'): LabeledSelectPo {
    return new LabeledSelectPo(selector);
  }

  clickActionButton(text: string) {
    return this.card.getActionButton().contains(text).click();
  }
}
