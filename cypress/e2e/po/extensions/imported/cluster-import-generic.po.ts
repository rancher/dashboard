import ClusterManagerImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.po';

/**
 * Import page for generic cluster
 */
export default class ClusterManagerImportGenericPagePo extends ClusterManagerImportPagePo {
  registriesAccordion() {
    return this.self().find('[data-testid="registries-accordion"]');
  }

  networkingAccordion() {
    return this.self().find('[data-testid="networking-accordion"]');
  }

  versionManagementBanner() {
    return this.self().find('[data-testid="version-management-banner"]');
  }
}
