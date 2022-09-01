import HarvesterResource from './harvester';

export default class HciSupportBundle extends HarvesterResource {
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
