import ComponentPo from '@/cypress/integration/po/components/component.po';

export default class ProductNavPo extends ComponentPo {
  constructor() {
    super('.side-nav');
  }

  groups() {
    return this.self().find('.accordion.has-children');
  }

  expandedGroup() {
    return this.self().find('.accordion.expanded');
  }

  visibleNavTypes() {
    return this.self().find('.accordion.expanded li.nav-type>a');
  }
}
