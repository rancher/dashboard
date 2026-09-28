import PagePo from '@/cypress/e2e/po/pages/page.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

// The overview's summary fetch resolves into one of two rendered states: the "By State" bento-grid
// (there are workloads) or the empty state (e.g. an empty namespace filter, as the
// "pagination is hidden" tests use). Either one confirms the overview finished loading.
export const WORKLOAD_OVERVIEW_LOADED_SELECTOR = '.bento-grid, [data-testid="workload-dashboard-empty"]';

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
   * Wait for the overview to finish loading (bento-grid or the empty state rendered).
   */
  waitForOverviewLoaded() {
    return this.self().find(WORKLOAD_OVERVIEW_LOADED_SELECTOR, LONG_TIMEOUT_OPT).should('be.visible');
  }
}
