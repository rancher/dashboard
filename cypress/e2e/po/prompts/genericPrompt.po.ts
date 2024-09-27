import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CardPo from '@/cypress/e2e/po/components/card.po';

export default class GenericPrompt extends ComponentPo {
  card = new CardPo();

  getTitle() {
    return this.card.getTitle();
  }

  getBody() {
    return this.card.getBody();
  }

  cancel() {
    return this.self().find('.btn role-secondary');
  }

  submit(text: string) {
    return this.card.getActionButton().contains(text).click();
  }
}
