import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciSupportBundle extends SteveModel {
  get bundleState() {
    const state = this?.status?.state;

    // ready、generating
    return state;
  }

  get bundleMessage() {
    const state = this?.metadata?.state;

    if (state.error) {
      return state?.message;
    }

    return false;
  }

  get precent() {
    return this?.status?.progress / 100 || 0;
  }

  get customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'spec.description',
        required:       true,
        translationKey: 'harvester.modal.bundle.description',
      },
    ];
  }
}
