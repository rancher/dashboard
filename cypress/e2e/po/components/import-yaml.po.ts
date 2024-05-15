import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
export class ImportYamlPo extends ComponentPo {
  constructor() {
    super('[data-testid="import-yaml"]');
  }

  importYamlEditor() {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }

  importYamlSuccessTitleCheck() {
    this.self().find('[data-testid="import-yaml-success"]').should('be.visible');
  }

  importYamlImportClick() {
    this.self().find('[data-testid="import-yaml-import-action"]').click();
  }

  importYamlCloseClick() {
    this.self().find('[data-testid="import-yaml-close"]').click();
  }

  importYamlSortableTable() {
    return new SortableTablePo(this.self());
  }
}
