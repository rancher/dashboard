import ComponentPo from '@/cypress/integration/po/components/component.po';
import { CypressChainable } from '@/cypress/integration/po/po.types';

export default class BurgerMenuPo extends ComponentPo {
  constructor() {
    super('.side-menu');
  }

  // Burger Menu

  static toggle(): CypressChainable {
    return cy.get('.menu-icon').click();
  }

  static openIfClosed(): CypressChainable {
    return cy.get('body').then((body) => {
      if (body.find('.menu.raised').length === 0) {
        return this.toggle();
      }
    });
  }

  // Body

  categories() {
    return this.self().find('.body .category');
  }

  links() {
    return this.self().find('.body .option');
  }

  clusters() {
    return this.self().find('.body .clusters .cluster.selector.option');
  }

  // Footer

  localization() {
    return this.self().find('.locale-chooser');
  }
}
