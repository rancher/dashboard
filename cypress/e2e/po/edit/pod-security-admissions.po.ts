import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import InputPo from '@/cypress/e2e/po/components/input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

export default class PodSecurityAdmissionsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/manager/management.cattle.io.podsecurityadmissionconfigurationtemplate`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', id?: string) {
    super(PodSecurityAdmissionsCreateEditPo.createPath(clusterId, id));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  psaControlLevel(itemRow: number, optionIndex: number) {
    const selectMode = new LabeledSelectPo(`[data-testid="pod-security-admission--psaControl-${ itemRow }-level"]`, this.self());

    selectMode.toggle();
    selectMode.clickOption(optionIndex);
  }

  psaControlVersion(itemRow: number, text: string) {
    const setVersion = new InputPo(`[data-testid="pod-security-admission--psaControl-${ itemRow }-version"]`, this.self());

    setVersion.set(text);
  }

  setExemptionsCheckbox(optionIndex: number) {
    const setExemptionsCheckbox = new CheckboxInputPo(`[data-testid="pod-security-admission--psaExemptionsControl-${ optionIndex }-active"]`);

    setExemptionsCheckbox.set();
  }

  setExemptionsInput(optionIndex: number, text: string) {
    const setExemptionsInputbox = new InputPo(`[data-testid="pod-security-admission--psaExemptionsControl-${ optionIndex }-value"]`);

    setExemptionsInputbox.set(text);
  }

  editAsYaml() {
    return new AsyncButtonPo('[data-testid="form-yaml"]', this.self());
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
