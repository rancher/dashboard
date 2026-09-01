import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for api key resources
 */
export default class ApiKeysListPo extends BaseResourceList {
  actionMenu(accessKey: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(accessKey);
  }

  details(accessKey: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(accessKey).column(index);
  }
}
