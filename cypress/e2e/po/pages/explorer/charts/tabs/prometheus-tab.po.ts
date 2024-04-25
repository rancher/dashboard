import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import { MonitoringTab } from './monitoring-tab.po';

export class PrometheusTab extends MonitoringTab {
  tabID(): string {
    return 'prometheus';
  }

  persistentStorage(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="checkbox-chart-enable-persistent-storage"]');
  }

  storageClass(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');
  }
}
