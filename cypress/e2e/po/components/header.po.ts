import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/workspace-switcher.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
export class HeaderPo extends ComponentPo {
  constructor() {
    super('[data-testid="header"]');
  }

  selectWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    wsFilter.toggle();

    return wsFilter.clickOptionWithLabel(name);
  }

  importYamlHeaderAction() {
    return this.self().find('[data-testid="header-action-import-yaml"]');
  }

  importYamlEditor() {
    return CodeMirrorPo.bySelector(cy.get('[data-testid="import-yaml"]'), '[data-testid="yaml-editor-code-mirror"]');
  }

  importYamlSuccessTitleCheck() {
    cy.get('[data-testid="import-yaml"] [data-testid="import-yaml-success"]').should('be.visible');
  }

  importYamlImportClick() {
    cy.get('[data-testid="import-yaml"]').find('[data-testid="import-yaml-import-action"]').click();
  }

  importYamlSortableTable() {
    return new SortableTablePo(cy.get('[data-testid="import-yaml"]'));
  }

  clusterIcon() {
    return this.self().find('.cluster-icon');
  }

  clusterName() {
    return this.self().find('.cluster-name');
  }

  customBadge() {
    return this.self().find('.cluster-badge');
  }
}
