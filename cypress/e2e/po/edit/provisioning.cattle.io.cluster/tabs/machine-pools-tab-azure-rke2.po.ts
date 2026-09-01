import { CypressChainable } from '@/cypress/e2e/po/po.types';
import MachinePoolRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/machine-pools-tab-rke2.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class MachinePoolAzureRke2 extends MachinePoolRke2 {
  environment(): CypressChainable {
    return this.self().find('[data-testid="machineConfig-azure-environment-value"] span');
  }

  location(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="machineConfig-azure-location"]', this.self());
  }
}
