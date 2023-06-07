import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberTolerationsPo from '@/cypress/e2e/po/components/embedded-ember/ember-tolerations.po';
import EmberRadioInputPo from '~/cypress/e2e/po/components/embedded-ember/ember-radio.input.po';

export default class EmberAgentConfigurationPo extends IframeComponentPo {
  // TODO nb ensure works w/ both accordions open
  cpuRequests() {
    return new EmberTextInputPo('[data-testid="resources-requests"] [data-testid="input-resources-cpu"]', this.self());
  }

  cpuLimits() {
    return new EmberTextInputPo('[data-testid="resources-limits"] [data-testid="input-resources-cpu"]', this.self());
  }

  memoryRequests() {
    return new EmberTextInputPo('[data-testid="resources-requests"] [data-testid="input-resources-memory"]', this.self());
  }

  memoryLimits() {
    return new EmberTextInputPo('[data-testid="resources-limits"] [data-testid="input-resources-memory"]', this.self());
  }

  tolerations() {
    return new EmberTolerationsPo('[data-testid="tolerations"]', this.self());
  }

  affinityRadio() {
    return new EmberRadioInputPo(`${ this.selector } [data-testid="radio-group-affinity-default"]`);
  }
}
