import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { MonitoringTab } from './monitoring-tab.po';

export class AlertingTab extends MonitoringTab {
  tabID(): string {
    return 'alerting';
  }

  deployCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo(cy.get('[aria-label="Deploy Alertmanager"]').parent().parent());
  }
}
