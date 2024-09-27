import PagePo from '@/cypress/e2e/po/pages/page.po';
import SecretsListPo from '@/cypress/e2e/po/lists/secrets-list.po';

export class SecretsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/secret`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SecretsPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(SecretsPagePo.createPath(clusterId));
  }

  secretsList(): SecretsListPo {
    return new SecretsListPo('[data-testid="sortable-table-list-container"]');
  }
}
