import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export default class MachinePoolsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithPartialName(name).column(index);
  }

  downloadYamlButton() {
    return new ResourceTablePo(this.self()).downloadYamlButton();
  }
}
