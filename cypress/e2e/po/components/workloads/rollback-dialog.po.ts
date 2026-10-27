import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class RollbackDialogPo extends ComponentPo {
  constructor(selector = '#modal-container-element') {
    super(selector);
  }

  shouldBeVisible(): this {
    this.self().should('be.visible');

    return this;
  }

  shouldBeClosed(): this {
    this.self().should('not.exist');

    return this;
  }

  private revisionSelect(): LabeledSelectPo {
    return new LabeledSelectPo('.labeled-select', this.self());
  }

  selectRevision(revisionNumber: number): this {
    this.revisionSelect().toggle();
    // The trailing comma stops "Revision 1" from matching "Revision 10"
    this.revisionSelect().clickOptionWithLabel(`Revision ${ revisionNumber },`);

    return this;
  }

  private rollbackButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  rollBack(): void {
    this.rollbackButton().clickWhenEnabled();
  }
}
