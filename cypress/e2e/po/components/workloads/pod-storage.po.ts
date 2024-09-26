import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class WorkloadPodStoragePo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  nthVolumeComponent(n: number) {
    return this.self().find(`[data-testid="volume-component-${ n }"]`);
  }
}
