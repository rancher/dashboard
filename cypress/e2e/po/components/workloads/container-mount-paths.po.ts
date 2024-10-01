import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ButtonDropdownPo from '@/cypress/e2e/po/components/button-dropdown.po';
import InputPo from '@/cypress/e2e/po/components/input.po';

class ContainerMountPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nthMountPoint(i: number) {
    return new InputPo(`[data-testid="mount-path-${ i }"] input:first-child`);
  }
}

export default class ContainerMountPathPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  addVolumeButton() : ButtonDropdownPo {
    // return this.self().find('[data-testid="container-storage-add-button"]');
    return new ButtonDropdownPo('[data-testid="container-storage-add-button"]');
  }

  addVolume(label: string) {
    this.addVolumeButton().toggle();
    this.addVolumeButton().clickOptionWithLabel(label);
  }

  nthVolumeMount(i: number): ContainerMountPo {
    return new ContainerMountPo(`[data-testid="container-storage-mount-${ i }"]`);
  }

  removeVolume(i: number) {
    this.self().find(`[data-testid="container-storage-array-list"] [data-testid="remove-item-${ i }"]`).click();
  }
}
