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

  get stateObj() {
    switch (this.read) {
    case true:
      return {
        name:          'ready',
        error:         false,
        transitioning: false,
      };
    case false:
      return {
        name:          'notready',
        error:         true,
        transitioning: false,
      };
    default:
      return {
        name:          'pending',
        error:         false,
        transitioning: false,
      };
    }
  }
}
