export default {
  // availableActions() {
  //   const out = this._standardActions;

  //   const upgrade = {
  //     action:     'upgrade',
  //     enabled:    true,
  //     icon:       'icon icon-fw icon-edit',
  //     label:      'Upgrade',
  //     total:      1,
  //   };

  //   out.unshift(upgrade);

  //   return out;
  // },

  details() {
    const t = this.$rootGetters['i18n/t'];

    return [
      {
        label:     t('model."catalog.cattle.io.release".firstDeployed'),
        formatter: 'LiveDate',
        content:   this.spec?.info?.firstDeployed
      },
      {
        label:     t('model."catalog.cattle.io.release".lastDeployed'),
        formatter: 'LiveDate',
        content:   this.spec?.info?.lastDeployed
      },
    ];
  },

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

  // upgrade() {
  //   return () => {
  //     debugger;
  //   };
  // },

  remove() {
    return (opt = {}) => {
      return this.doAction('uninstall', opt);
    };
  },
};
