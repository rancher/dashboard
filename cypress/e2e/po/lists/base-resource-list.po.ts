import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';

/**
 * Convenience base class
 */
export default class BaseResourceList extends ComponentPo {
  masthead() {
    return new ResourceListMastheadPo(this.self());
  }

  resourceTable() {
    return new ResourceTablePo(this.self());
  }

  actionMenu(rowLabel: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(rowLabel);
  }

  rowWithName(rowLabel: string) {
    return this.resourceTable().sortableTable().rowWithName(rowLabel);
  }
}
