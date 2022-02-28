import Resource from '@/plugins/core-store/resource-class';

export default class ApplicationInstanceResource extends Resource {
  // get _availableActions() {
  //   return [{
  //     action:     'openShell',
  //     enabled:    this.ready, // TODO: Always the case?
  //     icon:       'icon icon-fw icon-chevron-right',
  //     label:      this.t('action.openShell'),
  //   }];
  // }

  get state() {
    switch (this.ready) {
    case true:
      return 'ready';
    case false:
      return 'notready';
    default:
      return 'pending';
    }
  }
}
