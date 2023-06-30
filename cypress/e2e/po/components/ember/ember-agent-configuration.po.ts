import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberTolerationsPo from '@/cypress/e2e/po/components/ember/ember-tolerations.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/ember/ember-radio.input.po';
import EmberNodeAffinityPo from '@/cypress/e2e/po/components/ember/ember-node-affinity.po';
import EmberPodAffinityPo from '@/cypress/e2e/po/components/ember/ember-pod-affinity.po';

export default class EmberAgentConfigurationPo extends EmberComponentPo {
  cpuRequests() {
    return new EmberInputPo(`${ this.selector } [data-testid="resources-requests"] [data-testid="input-resources-cpu"]`);
  }

  cpuLimits() {
    return new EmberInputPo(`${ this.selector } [data-testid="resources-limits"] [data-testid="input-resources-cpu"]`);
  }

  memoryRequests() {
    return new EmberInputPo(`${ this.selector } [data-testid="resources-requests"] [data-testid="input-resources-memory"]`);
  }

  memoryLimits() {
    return new EmberInputPo(`${ this.selector } [data-testid="resources-limits"] [data-testid="input-resources-memory"]`);
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
