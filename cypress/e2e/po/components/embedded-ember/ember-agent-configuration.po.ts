import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberTolerationsPo from '@/cypress/e2e/po/components/embedded-ember/ember-tolerations.po';

export default class EmberAgentConfigurationPo extends IframeComponentPo {
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

  affinityRadio() {}
}
