import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';

export default class EmberRadioInputPo extends IframeComponentPo {
  // select a radio option matching provided label
  clickLabel(label: string) {
    this.self().find('label').contains(label).click();
  }
}
