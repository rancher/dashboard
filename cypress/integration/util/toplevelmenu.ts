export class TopLevelMenu {
  toggle() {
    cy.get('.menu-icon').click();
  }

  categories() {
    return cy.get('.side-menu .body .category');
  }

  clusters() {
    return cy.get('.clusters .cluster.selector.option');
  }

  localization() {
    return cy.get('.locale-chooser');
  }
}
