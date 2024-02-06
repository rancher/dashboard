import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class CloudCredentialsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
