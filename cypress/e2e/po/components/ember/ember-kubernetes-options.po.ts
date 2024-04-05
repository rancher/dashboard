import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';

export default class EmberKubernetesOptionsPo extends EmberComponentPo {
  kubernetesVersion() {
    return new EmberSelectPo(`[data-testid="__content"]:nth-of-type(2) div.ember-view:nth-child(1) div select`);
  }

  networkProvider() {
    return new EmberSelectPo(`[data-testid="__content"]:nth-of-type(2) .ember-view .row:nth-child(1) select`);
  }
}
