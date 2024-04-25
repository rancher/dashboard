import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export class GrafanaTab extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  requestedCpu(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="input-grafana-requests-cpu"]');
  }

  requestedMemory(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="input-grafana-requests-memory"]');
  }

  cpuLimit(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="input-grafana-limits-cpu"]');
  }

  memoryLimit(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="input-grafana-limits-memory"]');
  }
}
