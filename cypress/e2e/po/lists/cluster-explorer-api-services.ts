import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import BaseResourceList from '~/cypress/e2e/po/lists/base-resource-list.po';

/**
 * Convenience base class
 */
export default class APIServicesResourceList extends BaseResourceList {
  masthead() {
    return new ResourceListMastheadPo('.sortable-table-header');
  }

  resourceTable() {
    return new ResourceTablePo('.sortable-table');
  }
}
