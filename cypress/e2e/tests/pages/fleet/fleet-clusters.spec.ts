import { FleetClusterListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.cluster.po';
import { MenuActions } from '@/cypress/support/types/menu-actions';

describe('Fleet Clusters', () => {
  describe('List', { tags: ['@fleet', '@adminUser'] }, () => {
    let fleetClusterListPage: FleetClusterListPagePo;

    beforeEach(() => {
      cy.login();
      fleetClusterListPage = new FleetClusterListPagePo();
      fleetClusterListPage.goTo();

      // NB: No additional clusters are provisioned
      // Look only at the local clusters
      fleetClusterListPage.selectWorkspace();
    });

    it('should be able to list clusters in local workspace', () => {
      fleetClusterListPage.checkRowCount(false, 1);
    });

    it.skip('should only display action menu with allowed actions only', () => {
      const constActionMenu = fleetClusterListPage.rowActionMenuOpen('local');

      const allowedActions: MenuActions[] = [
        MenuActions.Pause,
        MenuActions.ForceUpdate,
        MenuActions.EditYaml,
        MenuActions.EditConfig,
        MenuActions.ViewInApi,
      ];

      const disabledActions: MenuActions[] = [MenuActions.ChangeWorkspace];

      allowedActions.forEach((action) => {
        constActionMenu.getMenuItem(action).should('exist');
      });

      // Disabled actions should not exist
      disabledActions.forEach((action) => {
        constActionMenu.getMenuItem(action).should('not.exist');
      });
    });
  });
});
