export class TopLevelMenu {
  toggle() {
    cy.get('.menu-icon').click();
  }

  openIfClosed() {
    cy.get('body').then((body) => {
      if (body.find('.menu.raised').length === 0) {
        this.toggle();
      }
    });
  }

  categories() {
    return cy.get('.side-menu .body .category');
  }

  links() {
    return cy.get('.side-menu .option');
  }

  clusters() {
    return cy.get('.clusters .cluster.selector.option');
  }

  localization() {
    return cy.get('.locale-chooser');
  }
}
