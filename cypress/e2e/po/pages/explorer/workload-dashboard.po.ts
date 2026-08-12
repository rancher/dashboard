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
   * The "By State" bento-grid, rendered once the overview's summary fetch resolves WITH data.
   */
  bentoGrid() {
    return this.self().find('.bento-grid', LONG_TIMEOUT_OPT);
  }

  /**
   * Wait for the overview to finish loading. Its summary fetch resolves into one of two rendered
   * states - the bento-grid (there are workloads) or the empty state (e.g. an empty namespace
   * filter, as the "pagination is hidden" tests use) - so either one confirms the overview loaded
   * and settled (no redirect), which is what we need before navigating on from it.
   */
  waitForOverviewLoaded() {
    return this.self().find('.bento-grid, [data-testid="workload-dashboard-empty"]', LONG_TIMEOUT_OPT).should('be.visible');
  }
}
