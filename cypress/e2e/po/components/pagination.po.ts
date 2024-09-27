import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PaginationPo extends ComponentPo {
  constructor(selector = 'div.paging') {
    super(selector);
  }

  beginningButton() {
    return this.self().find('[data-testid="pagination-first"]');
  }

  leftButton() {
    return this.self().find('[data-testid="pagination-prev"]');
  }

  rightButton() {
    return this.self().find('[data-testid="pagination-next"]');
  }

  endButton() {
    return this.self().find('[data-testid="pagination-last"]');
  }

  paginationText() {
    return this.self().find('span').invoke('text');
  }
}
