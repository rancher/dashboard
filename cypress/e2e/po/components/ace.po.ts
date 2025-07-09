import ComponentPo from '@/cypress/e2e/po/components/component.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class ACE extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  enable() {
    const radioButton = new RadioGroupInputPo('[data-testid="ace-enabled-radio-input"]');

    return radioButton.set(1);
  }

  fqdn() {
    return LabeledInputPo.byLabel(this.self(), 'FQDN');
  }

  caCerts() {
    return LabeledInputPo.byLabel(this.self(), 'CA Certificates');
  }

  enterFdqn(val: string) {
    return new LabeledInputPo('[data-testid="ace-fqdn-input"]').set(val);
  }

  enterCaCerts(val: string) {
    return new LabeledInputPo('[data-testid="ace-cacerts-input"]').set(val);
  }
}
