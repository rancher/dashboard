import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ListRowPo extends ComponentPo {
  column(index: number) {
    return this.self().find('td').eq(index);
  }
}
