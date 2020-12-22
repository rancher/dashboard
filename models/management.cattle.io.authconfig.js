import { insertAt } from '@/utils/array';

export default {
  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'disable',
      label:      'Disable',
      icon:       'icon icon-spinner',
      enabled:    this.enabled === true,
    });

    insertAt(out, 1, { divider: true });

    return out;
  },

  nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.id }"`, null, this.id);
  },

  state() {
    if ( this.enabled ) {
      return 'active';
    }

    return 'inactive';
  },

  disable() {
    return () => {
      this.enabled = false;
      this.save();
    };
  }
};
