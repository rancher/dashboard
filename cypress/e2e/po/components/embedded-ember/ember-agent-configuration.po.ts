import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberTolerationsPo from '@/cypress/e2e/po/components/embedded-ember/ember-tolerations.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-radio.input.po';
import EmberNodeAffinityPo from '@/cypress/e2e/po/components/embedded-ember/ember-node-affinity.po';
import EmberPodAffinityPo from '@/cypress/e2e/po/components/embedded-ember/ember-pod-affinity.po';

export default class EmberAgentConfigurationPo extends IframeComponentPo {
  // TODO nb ensure works w/ both accordions open
  cpuRequests() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="resources-requests"] [data-testid="input-resources-cpu"]`);
  }

  cpuLimits() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="resources-limits"] [data-testid="input-resources-cpu"]`);
  }

  memoryRequests() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="resources-requests"] [data-testid="input-resources-memory"]`);
  }

  memoryLimits() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="resources-limits"] [data-testid="input-resources-memory"]`);
  }

  tolerations() {
    return new EmberTolerationsPo(`${ this.selector } [data-testid="tolerations"]`);
  }

  affinityRadio() {
    return new EmberRadioInputPo(`${ this.selector } [data-testid="radio-group-affinity-default"]`);
  }

  nodeAffinity() {
    return new EmberNodeAffinityPo(`${ this.selector } [data-testid="node-affinity"]`);
  }

  podAffinity() {
    return new EmberPodAffinityPo(`${ this.selector } [data-testid="pod-affinity"]`);
  }
}
