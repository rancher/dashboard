import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class SelectIconGridPo extends ComponentPo {
  constructor(selector: string, private componentId = 'select-icon-grid') {
    super(selector);
  }

  select(name: string) {
    return this.self().find('.name').contains(name).click();
  }

  getGridEntry(idx: number, componentTestId = this.componentId) {
    return this.self().find(`[data-testid="${ componentTestId }-${ idx }"]`);
  }
}
