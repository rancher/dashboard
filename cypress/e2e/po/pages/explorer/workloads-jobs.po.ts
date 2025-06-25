import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '~/cypress/e2e/po/pages/base/base-detail-page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export class WorkloadsJobsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/batch.job`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadsJobsListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadsJobsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Workloads');
    sideNav.navToSideMenuEntryByLabel('Jobs');
  }
}

export class WorkLoadsJobDetailsPagePo extends BaseDetailPagePo {
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

  containerImage(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Container Image');
  }

  errorBanner() {
    return cy.get('#cru-errors');
  }
}
