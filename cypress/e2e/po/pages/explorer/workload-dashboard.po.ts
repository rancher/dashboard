import PagePo from '@/cypress/e2e/po/pages/page.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

/**
 * The Workloads overview page (`/c/<cluster>/explorer/workload-dashboard`).
 */
export default class WorkloadDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/workload-dashboard`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(WorkloadDashboardPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(WorkloadDashboardPagePo.createPath(clusterId));
  }

  /**
   * The "By State" bento-grid. It renders only once the overview's summary fetch has resolved with
   * data, so its presence confirms the overview has actually loaded.
   */
  bentoGrid() {
    return this.self().find('.bento-grid', LONG_TIMEOUT_OPT);
  }

  /**
   * Wait for the overview to finish loading (its bento-grid rendered).
   */
  waitForOverviewLoaded() {
    return this.bentoGrid().should('be.visible');
  }
}
