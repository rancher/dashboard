import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import FooterPo from '@/cypress/e2e/po/components/footer.po';

/**
 * Covers core functionality that's common to the dashboard's import or create cluster pages
 */
export default class AppClusterRepoEditPo extends PagePo {
  private static createPath(clusterId: string, type = 'create') {
    return `/c/${ clusterId }/apps/catalog.cattle.io.clusterrepo/${ type }`;
  }

  static goTo(clusterId: string, type = 'create'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AppClusterRepoEditPo.createPath(clusterId, type));
  }

  constructor(clusterId: string, type = 'create') {
    super(AppClusterRepoEditPo.createPath(clusterId, type));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  // Form
  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  selectRadioOptionGitRepo(index: number): Cypress.Chainable {
    const radioButton = new RadioGroupInputPo('[data-testid="clusterrepo-radio-input"]');

    return radioButton.set(index);
  }

  authSelectOrCreate(): SelectOrCreateAuthPo {
    return new SelectOrCreateAuthPo('[data-testid="clusterrepo-auth-secret"]');
  }

  gitRepoName() {
    return this.self().get('[data-testid="clusterrepo-git-repo-input"]').invoke('val');
  }

  enterGitRepoName(name: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-git-repo-input"]').set(name);
  }

  gitRepoBranchName() {
    return this.self().get('[data-testid="clusterrepo-git-branch-input"]').invoke('val');
  }

  enterGitBranchName(name: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-git-branch-input"]').set(name);
  }

  helmIndexUrl() {
    return this.self().get('[data-testid="clusterrepo-helm-url-input"]').invoke('val');
  }

  enterHelmIndexURL(url: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-helm-url-input"]').set(url);
  }

  ociUrl() {
    return this.self().get('[data-testid="clusterrepo-oci-url-input"]').invoke('val');
  }

  enterOciURL(url: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-oci-url-input"]').set(url);
  }

  ociCaBundle() {
    return this.self().get('[data-testid="clusterrepo-oci-cabundle-input"]').invoke('val');
  }

  enterOciCaBundle(value: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-oci-cabundle-input"]').set(value);
  }

  ociSkipTlsCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="clusterrepo-oci-skip-tls-checkbox"]');
  }

  ociInsecurePlainHttpCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="clusterrepo-oci-insecure-plain-http"]');
  }

  ociMinWait() {
    return this.self().get('[data-testid="clusterrepo-oci-min-wait-input"] input').invoke('val');
  }

  enterOciMinWait(value: string) {
    return new UnitInputPo('[data-testid="clusterrepo-oci-min-wait-input"]').setValue(value);
  }

  ociMaxWait() {
    return this.self().get('[data-testid="clusterrepo-oci-max-wait-input"] input').invoke('val');
  }

  enterOciMaxWait(value: string) {
    return new UnitInputPo('[data-testid="clusterrepo-oci-max-wait-input"]').setValue(value);
  }

  ociMaxRetries() {
    return this.self().get('[data-testid="clusterrepo-oci-max-retries-input"]').invoke('val');
  }

  enterOciMaxRetries(value: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-oci-max-retries-input"]').set(value);
  }

  create() {
    return new FooterPo('[data-testid="clusterrepo-footer"]').create();
  }

  save() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]').click();
  }
}
