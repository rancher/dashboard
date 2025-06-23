import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

export default class FilterPanelPo extends ComponentPo {
  getFiltersByGroupName(groupName: string) {
    return this.self()
      .find('[data-testid="filter-panel-filter-group"]')
      .filter(`:has(h4:contains("${ groupName }"))`)
      .find('[data-testid="filter-panel-filter-checkbox"]');
  }

  getFilterByName(name: string) {
    return CheckboxInputPo.byLabel(this.self(), name);
  }

  assertAllCheckboxesUnchecked() {
    this.self()
      .find('[data-testid^="filter-panel-filter-checkbox"]')
      .each(($el) => {
        cy.wrap($el).should('not.be.checked');
      });
  }
}
