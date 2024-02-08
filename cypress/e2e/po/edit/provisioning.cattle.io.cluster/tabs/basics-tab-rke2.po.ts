import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export default class BasicsRke2 extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  kubernetesVersions(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="clusterBasics__kubernetesVersions"]');
  }
}
