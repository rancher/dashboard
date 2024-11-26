import ComponentPo from '@/cypress/e2e/po/components/component.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ButtonDropdownPo from '@/cypress/e2e/po/components/button-dropdown.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';

class WorkloadVolumePo extends ComponentPo {
  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}

export default class WorkloadPodStoragePo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nthVolumeComponent(n: number) {
    return new WorkloadVolumePo(`[data-testid="volume-component-${ n }"]`);
  }

  addVolumeButton() : ButtonDropdownPo {
    return new ButtonDropdownPo('[data-testid="dropdown-button-storage-volume"]');
  }

  driverInput(): SelectPo {
    return new SelectPo('[data-testid="workload-storage-driver"]');
  }
}
