import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class RoleListPo extends BaseResourceList {
  downloadYaml() {
    return this.resourceTable().downloadYamlButton().first();
  }

  rowCloneYamlClick(name: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem('Clone')
      .click();
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

  checkBuiltIn(name: string, isBuiltIn = true) {
    const element = this.details(name, 4).find('span i.icon-checkmark');

    if (isBuiltIn) {
      element.should('exist');
    } else {
      element.should('not.exist');
    }
  }

  checkDefault(name: string, isDefault = true) {
    const element = this.details(name, 5).find('span i.icon-checkmark');

    if (isDefault) {
      element.should('exist');
    } else {
      element.should('not.exist');
    }
  }
}
