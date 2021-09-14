export default {
  bundleState() {
    const state = this?.status?.state;

    // ready、generating
    return state;
  },

  bundleMessage() {
    const state = this?.metadata?.state;

    if (state.error) {
      return state?.message;
    }

    return false;
  },

  precent() {
    return this?.status?.progress / 100 || 0;
  },

  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'spec.description',
        required:       true,
        translationKey: 'harvester.modal.bundle.description',
      },
    ];
  },
};
