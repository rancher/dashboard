import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BaseResourceList from '~/cypress/e2e/po/lists/base-resource-list.po';

export default class GitReposTab extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  list() {
    return new BaseResourceList('#repos [data-testid="sortable-table-list-container"]');
  }

  addRepostoryButton() {
    return this.self().get('.btn').contains('Add Repository');
  }
}
