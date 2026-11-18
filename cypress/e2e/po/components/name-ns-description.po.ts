import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectWithCreatePo from '@/cypress/e2e/po/components/labeled-select-with-create.po';

export default class NameNsDescription extends ComponentPo {
  name() {
    return new LabeledInputPo(this.self().find('[data-testid="name-ns-description-name"] input'));
  }

  description() {
    return new LabeledInputPo(this.self().find('[data-testid="name-ns-description-description"] input'));
  }

  namespace(): LabeledSelectWithCreatePo {
    return new LabeledSelectWithCreatePo(`[data-testid="name-ns-description-namespace"]`, this.self());
  }

  selectNamespace(label: string) {
    this.namespace().select().toggle();
    this.namespace().select().clickLabel(label);
  }

  project() {
    return new LabeledInputPo(this.self().find('[data-testid="name-ns-description-project"] input'));
  }
}
