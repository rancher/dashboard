import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ColorInputPo extends ComponentPo {
  value() {
    return this.self().find('.color-value').invoke('text').then((text) => text.toLowerCase());
  }

  previewColor() {
    return this.self().find('.color-display').should('have.css', 'background-color');
  }

  set(color: string) {
    return this.self().find('input').invoke('val', color).trigger('input');
  }
}
