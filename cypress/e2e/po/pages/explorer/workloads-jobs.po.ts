import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export class WorkloadsJobsListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/batch.job`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsJobsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsJobsListPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  listCreate() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  listElementWithName(name:string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }
}

export class WorkLoadsJobDetailsPagePo extends PagePo {
  static url: string;

  private static createPath(jobId: string, clusterId: string, namespaceId: string, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/batch.job/${ namespaceId }/${ jobId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(jobId: string, queryParams?: Record<string, string>, clusterId = 'local', namespaceId = 'default') {
    super(WorkLoadsJobDetailsPagePo.createPath(jobId, clusterId, namespaceId, queryParams));

    WorkLoadsJobDetailsPagePo.url = WorkLoadsJobDetailsPagePo.createPath(jobId, clusterId, namespaceId, queryParams);
  }

  selectNamespaceOption(index: number) {
    const selectVerb = new LabeledSelectPo(`[data-testid="name-ns-description-namespace"]`, this.self());

    selectVerb.toggle();
    selectVerb.clickOption(index);
  }

  namespace(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Namespace');
  }

  name() {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="name-ns-description-name"]');
  }

  containerImage(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Container Image');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  errorBanner() {
    return cy.get('#cru-errors');
  }
}
