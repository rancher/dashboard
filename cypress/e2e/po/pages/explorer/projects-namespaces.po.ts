import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import ProjectCreateEditPagePo from '@/cypress/e2e/po/edit/management.cattle.io.project.po';
import NamespaceCreateEditPagePo from '@/cypress/e2e/po/edit/namespace.po';

export default class ProjectNamespacePagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/projectsnamespaces`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ProjectNamespacePagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(ProjectNamespacePagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  createNamespaceButton() {
    return this.self().get('[data-testid="create_project_namespaces"]');
  }

  createProjectForm(projName?: string): ProjectCreateEditPagePo {
    return new ProjectCreateEditPagePo(this.clusterId, projName);
  }

  createNamespaceForm(nsName?: string): NamespaceCreateEditPagePo {
    return new NamespaceCreateEditPagePo(this.clusterId, nsName);
  }
}
