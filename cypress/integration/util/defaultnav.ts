export class DefaultNav {
  groups() {
    return cy.get('.accordion.has-children');
  }

  expandedGroup() {
    return cy.get('.accordion.expanded');
  }

  visibleNavTypes() {
    return cy.get('.side-nav .accordion.expanded li.nav-type>a');
  }
}
