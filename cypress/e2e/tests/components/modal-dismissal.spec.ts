import { ProjectsNamespacesListPagePo } from '@/cypress/e2e/po/pages/explorer/projects-namespaces.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

describe('Modal dismissal', { tags: ['@components', '@adminUser'] }, () => {
  const projectsNamespacesPage = new ProjectsNamespacesListPagePo();
  const clusterDashboard = new ClusterDashboardPagePo('local');
  const header = new HeaderPo();
  const promptRemove = () => new PromptRemove();
  const importYaml = () => header.importYaml();

  let namespaceName: string;

  const ensureNamespace = (name: string) => cy.request({ url: `${ Cypress.env('api') }/v1/namespaces/${ name }`, failOnStatusCode: false })
    .then((resp) => {
      if (resp.status === 404) {
        cy.createNamespace(name);
      }
    });

  before(() => {
    cy.createE2EResourceName('modal-dismissal').then((name) => {
      namespaceName = name;
    });
  });

  after(() => {
    if (namespaceName) {
      cy.login();
      cy.deleteRancherResource('v1', 'namespaces', namespaceName, false);
    }
  });

  describe('delete confirmation', () => {
    beforeEach(() => {
      cy.login();
      ensureNamespace(namespaceName);
      projectsNamespacesPage.goTo();
      projectsNamespacesPage.waitForPage();
      projectsNamespacesPage.list().resourceTable().sortableTable().filter(namespaceName);
      projectsNamespacesPage.list().resourceTable().sortableTable().rowActionMenuOpen(namespaceName)
        .getMenuItem('Delete')
        .click();
      promptRemove().checkVisible();
    });

    it('stays open, keeping the typed name, when a press on its text is released on the background', () => {
      promptRemove().confirm('modal-dismissal');

      promptRemove().confirmText().realMouseDown();
      promptRemove().background().realMouseUp({ position: 'topLeft' });

      promptRemove().checkVisible();
      promptRemove().confirmField().value().should('eq', 'modal-dismissal');
    });

    it('closes on a click on the background', () => {
      promptRemove().background().realClick({ position: 'topLeft' });

      promptRemove().checkNotExists();
    });
  });

  describe('Import YAML', () => {
    const yaml = 'kind: ConfigMap';

    beforeEach(() => {
      cy.login();
      clusterDashboard.goTo();
      clusterDashboard.waitForPage();
      header.importYamlHeaderAction().click();
      importYaml().importYamlEditor().set(yaml);
    });

    it('stays open and keeps its YAML when a press in the editor is released on the background', () => {
      importYaml().importYamlEditor().self().find('.cm-line')
        .first()
        .realMouseDown();
      importYaml().background().realMouseUp({ position: 'topLeft' });

      importYaml().checkVisible();
      importYaml().importYamlEditor().value().should('eq', yaml);
    });

    it('closes on a click on the background', () => {
      importYaml().background().realClick({ position: 'topLeft' });

      importYaml().checkNotExists();
    });
  });
});
