import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import TooltipPo from '@/cypress/e2e/po/components/tooltip.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';

export default class MachinePoolsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithPartialName(name).column(index);
  }

  downloadYamlButton() {
    return new ResourceTablePo(this.self()).downloadYamlButton();
  }

  machinePoolCount(poolName: string, count: number | RegExp, options?: GetOptions) {
    return this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find('.group-header-buttons')
      .contains(count, options);
  }

  scaleDownButton(poolName: string) {
    return this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find('[data-testid="scale-down-button"]');
  }

  scaleUpButton(poolName: string) {
    return this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find('[data-testid="scale-up-button"]');
  }

  scaleButtonTooltip(poolName: string, button: 'plus' | 'minus'): TooltipPo {
    return new TooltipPo(this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find(`.group-header-buttons button .icon-${ button }`));
  }
}
