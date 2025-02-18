import ClusterManagerImportPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/import/cluster-import.po';

/**
 * Import page for generic cluster
 */
export default class ClusterManagerImportGenericPagePo extends ClusterManagerImportPagePo {
  repositoriesAccordion() {
    return this.self().find('[data-testid="repositories-accordion"]');
  }
}
