import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import CisBenchmarkListPo from '@/cypress/e2e/po/other-products/cis-benchmark-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class CisBenchmarkPo extends PagePo {
  static createPath(clusterId: string) {
    return `/c/${ clusterId }/gatekeeper`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CisBenchmarkPo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(CisBenchmarkPo.createPath(clusterId));
  }

  create(): Cypress.Chainable {
    return this.list().masthead().actions().contains('Create');
  }

  createFromYaml(): Cypress.Chainable {
    return this.list().masthead().actions().contains('Create from YAML');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  list(): CisBenchmarkListPo {
    return new CisBenchmarkListPo('[data-testid="sortable-table-list-container"]');
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
