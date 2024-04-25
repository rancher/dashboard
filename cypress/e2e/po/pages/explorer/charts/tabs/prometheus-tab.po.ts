import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export class PrometheusTab extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  persistentStorage(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="checkbox-chart-enable-persistent-storage"]');
  }

  storageClass(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');
  }
}
