import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

/**
 * The label and value rows at the top of a resource's detail page, e.g. Namespace, Age and, for a pod, ReplicaSet and Node
 */
export default class IdentifyingInformationPo extends ComponentPo {
  constructor(parent?: CypressChainable) {
    super('.identifying-information', parent);
  }

  row(label: string) {
    return this.self().find('.row').filter((_, el) => Cypress.$(el).children('label').text().trim() === label);
  }

  /**
   * The value of a row shown by a component, e.g. a link that opens a resource popover
   */
  customValue(label: string) {
    return this.row(label).find('.full-custom-value');
  }

  link(label: string) {
    return this.customValue(label).find('a');
  }

  stateDot(label: string) {
    return this.customValue(label).find('.rc-status-indicator');
  }

  popoverCard(label: string) {
    return this.customValue(label).find('#popover-card');
  }
}
