import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import BasicsRke2 from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/tabs/basics-tab-rke2.po';
import TabbedPo from '~/cypress/e2e/po/components/tabbed.po';

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

  selectOptionForCloudCredentialWithLabel(label: string) {
    const cloudCredSelect = new LabeledSelectPo(`[data-testid="cluster-prov-select-credential"]`, this.self());

    cloudCredSelect.toggle();
    cloudCredSelect.clickOptionWithLabel(label);
  }

  selectTab(options: TabbedPo, selector: string) {
    options.clickTabWithSelector(selector);

    return this;
  }

  editClusterAsYaml() {
    return this.resourceDetail().createEditView().editClusterAsYaml();
  }

  saveClusterAsYaml() {
    return this.resourceDetail().createEditView().saveClusterAsYaml();
  }

  create() {
    return this.resourceDetail().createEditView().create();
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }

  saveAndWait() {
    return this.resourceDetail().createEditView().saveAndWait();
  }

  basicsTab(): BasicsRke2 {
    return new BasicsRke2();
  }

  accordion(index: number, label: string) {
    return this.self().find(`.accordion-container:nth-of-type(${ index })`).contains(label);
  }

  toggleAccordion(index: number, label: string) {
    return this.accordion(index, label).click();
  }
}
