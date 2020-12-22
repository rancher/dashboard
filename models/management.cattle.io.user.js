export default {
  isSystem() {
    for ( const p of this.principalIds || [] ) {
      if ( p.startsWith('system://') ) {
        return true;
      }
    }

    return false;
  },

  nameDisplay() {
    return this.displayName || this.username || this.id;
  },

  labelForSelect() {
    const name = this.nameDisplay;
    const id = this.id;

    if ( name === id ) {
      return id;
    } else {
      return `${ name } (${ id })`;
    }
  },

  providerDisplay() {
    const principals = this.principalIds || [];
    let isSystem = false;
    let isLocal = true;
    let provider = '';

    for ( const p of principals ) {
      const idx = p.indexOf(':');
      const driver = p.substr(0, idx).toLowerCase().split('_')[0];

      if ( driver === 'system' ) {
        isSystem = true;
      } else if ( driver === 'local' ) {
        // Do nothing, defaults to local
      } else {
        isLocal = false;

        if ( provider ) {
          provider = 'multiple';
        } else {
          provider = driver;
        }
      }
    }

    let key;

    if ( isSystem ) {
      key = 'system';
    } else if ( isLocal ) {
      key = 'local';
    } else {
      key = provider;
    }

    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ key }"`, null, key);
  },

  state() {
    if ( this.enabled === false ) {
      return 'inactive';
    }

    return this.metadata?.state?.name || 'unknown';
  }
};
