import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';

export default class EmberAccordionItemPo extends IframeComponentPo {
  expand() {
    this.self().find('.accordion-header').click();
  }
}
