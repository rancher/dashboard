import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
export default class EmberAccordionPo extends EmberComponentPo {
  private headerSelector: string;
  private contentSelector: string;

  constructor(private rootTestId: string) {
    super(`.accordion:has(> [data-testid="${ rootTestId }__header"])`); // This should work, but given current functionality it isn't used
    this.headerSelector = `[data-testid="${ this.rootTestId }__header"]`;
    this.contentSelector = `[data-testid="${ this.rootTestId }__content"]`;
  }

  expand() {
    this.header().click();
  }

  header() {
    return cy.iFrame().find(this.headerSelector);
  }

  content() {
    return cy.iFrame().find(this.contentSelector);
  }
}
