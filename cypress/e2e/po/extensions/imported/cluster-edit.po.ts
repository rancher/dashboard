import PagePo from '@/cypress/e2e/po/pages/page.po';
import ACE from '@/cypress/e2e/po/components/ace.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

/**
 * Edit page for imported cluster
 */
export default class ClusterManagerEditImportedPagePo extends PagePo {
  private static createPath(clusterId: string, ns: string, clusterName: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster/${ ns }/${ clusterName }`;
  }

  goToClusterEditPage(clusterId: string, ns: string, clusterName: string ): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditImportedPagePo.createPath(clusterId, ns, clusterName));
  }

  constructor(clusterId = '_', ns = 'fleet-default', clusterName: string) {
    super(ClusterManagerEditImportedPagePo.createPath(clusterId, ns, clusterName));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  ace(): ACE {
    return new ACE();
  }

  accordion(index: number, label: string) {
    return this.self().find(`.accordion-container:nth-of-type(${ index })`).contains(label);
  }

  toggleAccordion(index: number, label: string) {
    return this.accordion(index, label).click();
  }

  versionManagementBanner() {
    return this.self().find('[data-testid="version-management-banner"]');
  }

  versionManagementRadioButton(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="imported-version-management-radio"]');
  }

  enableVersionManagement() {
    return this.versionManagementRadioButton().set(1);
  }

  disableVersionManagement() {
    return this.versionManagementRadioButton().set(2);
  }

  defaultVersionManagement() {
    return this.versionManagementRadioButton().set(0);
  }

  privateRegistryCheckbox() {
    return new CheckboxInputPo('[data-testid="private-registry-enable-checkbox"]');
  }

  enablePrivateRegistryCheckbox() {
    return this.privateRegistryCheckbox().set();
  }

  privateRegistry() {
    return LabeledInputPo.byLabel(this.self(), 'Container Registry');
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  save() {
    return this.resourceDetail().createEditView().save();
  }

  cancel() {
    return this.resourceDetail().createEditView().cancel();
  }
}
