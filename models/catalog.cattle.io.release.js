export default {
  nameDisplay() {
    let out = this.spec?.name || this.metadata?.name || this.id || '';

    const version = this.spec?.version;

    if ( version && version !== 1 ) {
      out += `:v${ version }`;
    }

    return out;
  },

  chartDisplay() {
    const meta = this.spec?.chart?.metadata;

    if ( meta ) {
      return `${ meta.name }:${ meta.version.startsWith('v') ? '' : 'v' }${ meta.version }`;
    } else {
      return '?';
    }
  },

  remove() {
    return (opt = {}) => {
      return this.doAction('uninstall', opt);
    };
  },
};
