import ComponentPo from '@/cypress/e2e/po/components/component.po';

/**
 * Asks which format to export resources in. Opened by a table's Export As..., which replaced
 * Download YAML; YAML is picked to begin with
 */
export default class ExportModalPo extends ComponentPo {
  constructor() {
    // Not its test id: opened for resources, the modal manager puts its own on the root
    super('.export-modal');
  }

  download() {
    return this.self().find('[data-testid="table-views-export-download"]').click();
  }

  cancel() {
    return this.self().find('[data-testid="table-views-export-cancel"]').click();
  }
}
