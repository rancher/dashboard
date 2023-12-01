import ComponentPo from '@/cypress/e2e/po/components/component.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

export default class ResourceTablePo extends ComponentPo {
  sortableTable() {
    return new SortableTablePo(this.self());
  }
}
