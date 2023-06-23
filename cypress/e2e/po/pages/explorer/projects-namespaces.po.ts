import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class ProjectNamespacePagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/projectsnamespaces`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ProjectNamespacePagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ProjectNamespacePagePo.createPath(clusterId));
  }

  flatListButton() {
    return this.self().getId('button-group-child-0');
  }

  flatListClick(): Cypress.Chainable {
    return this.flatListButton().click();
  }

  createProjectNamespaceButton() {
    return this.self().getId('create_project_namespaces');
  }

  createProjectNamespaceClick(): Cypress.Chainable {
    return this.createProjectNamespaceButton().click();
  }

  nsProject() {
    return this.self().getId('name-ns-description-project');
  }
}
