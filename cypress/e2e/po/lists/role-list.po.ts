import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class RoleListPo extends BaseResourceList {
  downloadYaml() {
    return this.resourceTable().downloadYamlButton().first();
  }

  delete() {
    return this.resourceTable().sortableTable().deleteButton().first();
  }

  elements() {
    return this.resourceTable().sortableTable().rowElements();
  }

  elementWithName(name: string) {
    return this.resourceTable().sortableTable().rowElementWithName(name);
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
