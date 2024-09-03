import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

class CronjobDetailPagePo extends PagePo {
  private static createPath(clusterId: string, id: string) {
    return `/c/${ clusterId }/explorer/batch.job/${ id }`;
  }

  goTo(clusterId: string, id:string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CronjobDetailPagePo.createPath(clusterId, id));
  }

  constructor(clusterId = 'local', id: string) {
    super(CronjobDetailPagePo.createPath(clusterId, id));
  }

  successfulCountCheck(countExpected: number, timeout = 15000) {
    // let's give it a buffer for the job to finish running
    cy.wait(timeout); // eslint-disable-line cypress/no-unnecessary-waiting

    return cy.get('.gauges__pods div:nth-child(1) div h1').invoke('text').should('contain', countExpected);
  }
}

export class CronjobListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/batch.cronjob`;
  }

  urlPath(clusterId = 'local') {
    return CronjobListPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CronjobListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(CronjobListPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }

  jobDetail(clusterId = 'local', id: string) {
    return new CronjobDetailPagePo(clusterId, id);
  }
}
