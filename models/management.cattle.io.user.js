import { NORMAN } from '@/config/types';

export default {
  isSystem() {
    for ( const p of this.principalIds || [] ) {
      if ( p.startsWith('system://') ) {
        return true;
      }
    }

    return false;
  },

  isCurrentUser() {
    const currentPrincipal = this.$rootGetters['auth/principalId'];

    return !!(this.principalIds || []).find(p => p === currentPrincipal);
  },

  principals() {
    return this.principalIds
      .map(id => this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, id))
      .filter(p => p);
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

  provider() {
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

    return key;
  },

  providerDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.provider }"`, null, this.provider);
  },

  state() {
    if ( this.enabled === false ) {
      return 'inactive';
    }

    return this.metadata?.state?.name || 'unknown';
  },

  save() {
    return async(opt) => {
      const clone = await this.$dispatch('clone', { resource: this });

      // Remove local properties
      delete clone.canRefreshAccess;

      return clone._save(opt);
    };
  },

  setEnabled() {
    return async(enabled) => {
      const clone = await this.$dispatch('clone', { resource: this.norman });

      clone.enabled = enabled;
      await clone.save();
    };
  },

  activate() {
    return async() => {
      await this.setEnabled(true);
    };
  },

  activateBulk() {
    return async(items) => {
      await Promise.all(items.map(item => item.setEnabled(true)));
    };
  },

  deactivate() {
    return async() => {
      await this.setEnabled(false);
    };
  },

  deactivateBulk() {
    return async(items) => {
      await Promise.all(items.map(item => item.setEnabled(false)));
    };
  },

  refreshGroupMembership() {
    return async() => {
      const user = await this.$dispatch('rancher/find', {
        type:       NORMAN.USER,
        id:   this.id,
      }, { root: true });

      await user.doAction('refreshauthprovideraccess');
    };
  },

  canActivate() {
    return (state) => {
      const stateOk = state ? this.state === 'inactive' : this.state === 'active';
      const permissionOk = this.hasLink('update'); // Not canUpdate, only gate on api not whether editable pages should be visible

      return stateOk && permissionOk && !this.isCurrentUser;
    };
  },

  _availableActions() {
    return [
      {
        action:     'activate',
        label:      this.t('action.activate'),
        icon:       'icon icon-play',
        bulkable:   true,
        bulkAction: 'activateBulk',
        enabled:    this.canActivate(true),
        weight:     2
      },
      {
        action:     'deactivate',
        label:      this.t('action.deactivate'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    this.canActivate(false),
        weight:     1
      },
      {
        action:     'refreshGroupMembership',
        label:      this.t('authGroups.actions.refresh'),
        icon:       'icon icon-refresh',
        enabled: this.canRefreshAccess
      },
      { divider: true },
      ...this._standardActions,
    ];
  },

  details() {
    return [
      {
        label:     this.t('user.detail.username'),
        formatter: 'CopyToClipboard',
        content:   this.username
      },
      ...this._details
    ];
  },

  confirmRemove() {
    return true;
  },

  norman() {
    return this.$rootGetters['rancher/byId'](NORMAN.USER, this.id);
  },

  canDelete() {
    return this.norman?.hasLink('remove') && !this.isCurrentUser;
  },

  canUpdate() {
    return this.norman?.hasLink('update');
  },

  remove() {
    return () => {
      return this.norman?.remove();
    };
  }
};
