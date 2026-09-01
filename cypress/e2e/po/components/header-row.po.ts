import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class HeaderRowPo extends ComponentPo {
  column(index: number) {
    return this.self().find('th').eq(index);
  }

  get(selector: string, options?: any) {
    return this.self().get(selector, options);
  }

  within(selector: string, options?: any) {
    return this.self().within(() => {
      this.get(selector, options);
    });
  }

  /**
   * check table header sort order
   * @param index
   * @param direction up or down (i.e. DESC or ASC)
   */
  checkSortOrder(index: number, direction: string) {
    this.column(index).find('.sort').find('.icon-stack > i').should('have.length', 2)
      .and('have.class', `icon-sort-${ direction }`);
  }
}
