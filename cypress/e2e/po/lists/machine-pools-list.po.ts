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

  machinePoolReadyofDesiredCount(poolName: string, count: number | RegExp, options?: GetOptions) {
    return this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find('.group-header-buttons')
      .contains(count, options);
  }

  showProgressTooltip(poolName: string) {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="machine-progress-popper"]').length === 0) {
        this.resourceTable().sortableTable().groupElementWithName(poolName)
          .find('[data-testid="machine-progress-bar"]')
          .click();
      }
    });
  }

  machineReadyCount(poolName: string, options?: GetOptions) {
    this.showProgressTooltip(poolName);

    return cy.get('[data-testid="machine-progress-popper"]', options)
      .contains('Ready')
      .closest('tr')
      .contains(/\d+/)
      .invoke('text');
  }

  machineUnavailableCount(poolName: string, options?: GetOptions) {
    this.showProgressTooltip(poolName);

    return cy.get('[data-testid="machine-progress-popper"]', options)
      .contains('Unavailable')
      .closest('tr')
      .contains(/\d+/)
      .invoke('text');
  }

  machinePendingCount(poolName: string, options?: GetOptions) {
    this.showProgressTooltip(poolName);

    return cy.get('[data-testid="machine-progress-popper"]', options)
      .contains('Pending')
      .closest('tr')
      .contains(/\d+/)
      .invoke('text');
  }

  machineProgressBar(poolName: string) {
    return this.resourceTable().sortableTable().groupElementWithName(poolName)
      .find('[data-testid="machine-progress-bar"]');
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
