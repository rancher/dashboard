import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Covers core functionality that's common to the dashboard's import or create cluster pages
 */
export default abstract class ClusterManagerCreateImportPagePo extends PagePo {
  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  // Form
  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  create() {
    return this.resourceDetail().createEditView().create();
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }
}
