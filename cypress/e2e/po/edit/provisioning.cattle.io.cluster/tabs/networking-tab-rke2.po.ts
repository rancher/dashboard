import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class NetworkRke2 extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  clusterCIDR(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="cluster-cidr"]');
  }

  serviceCIDR(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="service-cidr"]');
  }

  stackPreference(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="network-tab-stackpreferences"]');
  }

  flannelMasq(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="cluster-rke2-flannel-masq-checkbox"]');
  }
}
