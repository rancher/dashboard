import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BaseResourceList from '~/cypress/e2e/po/lists/base-resource-list.po';

export default class BundlesTab extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  list() {
    return new BaseResourceList('#bundles [data-testid="sortable-table-list-container"]');
  }
}
