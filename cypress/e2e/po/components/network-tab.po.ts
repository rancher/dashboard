import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

export default class NetworkTabPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  truncateHostnameCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="network-tab-truncate-hostname"]');
  }
}
