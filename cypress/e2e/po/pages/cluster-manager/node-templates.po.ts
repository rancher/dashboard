import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberListPo from '@/cypress/e2e/po/components/ember/ember-list.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberFormRkeTemplatesPo from '@/cypress/e2e/po/components/ember/ember-form-rke-templates.po';
import EmberModalAddNodeTemplatePo from '@/cypress/e2e/po/components/ember/ember-modal-add-node-template.po';

export default class NodeTemplatesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/node-templates`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodeTemplatesPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(NodeTemplatesPagePo.createPath(clusterId));
  }

  addNodeTemplateModal(): EmberModalAddNodeTemplatePo {
    return new EmberModalAddNodeTemplatePo();
  }

  list(): EmberListPo {
    return new EmberListPo('.sortable-table .main-row');
  }

  actions(): EmberListPo {
    return new EmberListPo('.right-buttons');
  }

  dropdown(): EmberSelectPo {
    return new EmberSelectPo('.ember-basic-dropdown-content');
  }

  form(): EmberFormRkeTemplatesPo {
    return new EmberFormRkeTemplatesPo('form.horizontal-form ');
  }

  formActions(): EmberFormRkeTemplatesPo {
    return new EmberFormRkeTemplatesPo('[data-testid="save-cancel-rke1"]');
  }
}
