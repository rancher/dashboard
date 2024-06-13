import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PaginationPo extends ComponentPo {
  constructor(selector = 'div.paging') {
    super(selector);
  }

  beginningButton() {
    return this.self().find('button:nth-child(1)');
  }

  leftButton() {
    return this.self().find('button:nth-child(2)');
  }

  rightButton() {
    return this.self().find('button:nth-child(4)');
  }

  endButton() {
    return this.self().find('button:nth-child(5)');
  }

  paginationText() {
    return this.self().find('span').invoke('text');
  }
}
