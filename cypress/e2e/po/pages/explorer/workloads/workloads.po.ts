import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import WorkloadPagePo from '@/cypress/e2e/po/pages/explorer/workloads.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { WorkloadType } from '@shell/types/fleet';
export class workloadDetailsPageBasePo extends PagePo {
  static url: string;

  private static createPath(
    workloadId: string,
    clusterId: string,
    workloadType: WorkloadType,
    namespaceId: string,
    queryParams?: Record<string, string>
  ) {
    const urlStr = `/c/${ clusterId }/explorer/${ workloadType }/${ namespaceId }/${ workloadId }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(this.url);
  }

  constructor(workloadId: string, clusterId: string, workloadType: WorkloadType, queryParams?: Record<string, string>, namespaceId = 'default') {
    super(workloadDetailsPageBasePo.createPath(workloadId, clusterId, workloadType, namespaceId, queryParams));

    workloadDetailsPageBasePo.url = workloadDetailsPageBasePo.createPath(
      workloadId,
      clusterId,
      workloadType,
      namespaceId,
      queryParams
    );
  }

  private workload() {
    return new WorkloadPagePo();
  }

  deleteWithKubectl(name: string, namespace = 'default') {
    this.workload().deleteWithKubectl(name, namespace);
  }

  createWithKubectl(blueprintJson: string | Object, wait = 6000) {
    this.workload().createWithKubectl(blueprintJson, wait);
  }
}

export class WorkloadsListPageBasePo extends PagePo {
  static createPath(clusterId: string, workloadType: WorkloadType, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/${ workloadType }`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  constructor(clusterId = 'local', workloadType: WorkloadType, queryParams?: Record<string, string>) {
    super(WorkloadsListPageBasePo.createPath(clusterId, workloadType, queryParams));
  }

  navigateToCreatePage() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().eq(0).click();
  }

  resourcesList() {
    return new BaseResourceList(this.self());
  }

  sortableTable() {
    return this.resourcesList().resourceTable().sortableTable();
  }

  details(name: string, index: number) {
    return this.sortableTable().rowWithName(name).column(index);
  }

  deleteItemWithUI(name: string) {
    this.sortableTable().rowActionMenuOpen(name).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
  }

  createWithKubectl(blueprintJson: string | Object, wait = 6000) {
    this.workload().createWithKubectl(blueprintJson, wait);
  }

  listElementWithName(name: string) {
    return this.sortableTable().rowElementWithName(name);
  }

  goToDetailsPage(elemName: string) {
    return this.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  goToEditYamlPage(elemName: string) {
    return this.sortableTable().rowActionMenuOpen(elemName).getMenuItem('Edit YAML').click();
  }

  private workload() {
    return new WorkloadPagePo();
  }

  deleteWithKubectl(name: string, namespace = 'default') {
    this.workload().deleteWithKubectl(name, namespace);
  }
}

export class WorkloadsCreatePageBasePo extends PagePo {
  static createPath(clusterId: string, workloadType: WorkloadType, queryParams?: Record<string, string>) {
    const urlStr = `/c/${ clusterId }/explorer/${ workloadType }/create`;

    if (!queryParams) {
      return urlStr;
    }

    const params = new URLSearchParams(queryParams);

    return `${ urlStr }?${ params.toString() }`;
  }

  constructor(clusterId = 'local', workloadType: WorkloadType, queryParams?: Record<string, string>) {
    super(WorkloadsCreatePageBasePo.createPath(clusterId, workloadType, queryParams));
  }

  selectNamespace(label: string) {
    const selectVerb = new LabeledSelectPo(`[data-testid="name-ns-description-namespace"]`, this.self());

    selectVerb.toggle();
    selectVerb.clickLabel(label);
  }

  namespace(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Namespace');
  }

  name() {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="name-ns-description-name"]');
  }

  containerImage(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Container Image');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  createWithUI(name: string, containerImage: string, namespace = 'default') {
    // NB: namespace is already selected by default
    this.selectNamespace(namespace);
    this.name().set(name);
    this.containerImage().set(containerImage);
    this.saveCreateForm().click();
  }

  private workload() {
    return new WorkloadPagePo();
  }

  deleteWithKubectl(name: string, namespace = 'default') {
    this.workload().deleteWithKubectl(name, namespace);
  }

  createWithKubectl(blueprintJson: string | Object, wait = 6000) {
    this.workload().createWithKubectl(blueprintJson, wait);
  }
}
