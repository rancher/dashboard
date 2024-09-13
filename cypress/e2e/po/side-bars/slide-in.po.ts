import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class SlideInPo extends ComponentPo {
  constructor() {
    super('[data-testid="slide-in-panel"]');
  }

  closeButton() {
    return this.self().get('[data-testid="slide-in-panel-close"');
  }
}
