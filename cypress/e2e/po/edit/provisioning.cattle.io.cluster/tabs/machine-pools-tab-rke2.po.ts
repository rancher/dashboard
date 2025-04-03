import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class MachinePoolRke2 extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  poolName() {
    return new LabeledInputPo('[data-testid="machine-pool-name-input"]');
  }

  poolQuantity() {
    return new LabeledInputPo('[data-testid="machine-pool-quantity-input"]');
  }

  networks(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="amazonEc2__selectedNetwork"]');
  }
}
