import { NORMAN } from '@shell/config/types';
import HybridModel, { cleanHybridResources } from '@shell/plugins/steve/hybrid-class';
import day from 'dayjs';

export default class User extends HybridModel {
  // Preserve description
  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    const _description = data.description;

    super(data, ctx, rehydrateNamespace, setClone);
    this.description = _description;
  }

  // Clean the Norman properties, but keep description
  cleanResource(data) {
    const desc = data.description;
    const clean = cleanHybridResources(data);

    clean._description = desc;

    return clean;
  }

  get isSystem() {
    for ( const p of this.principalIds || [] ) {
      if ( p.startsWith('system://') ) {
        return true;
      }
    }

    return false;
  }

  get isCurrentUser() {
    const currentPrincipal = this.$rootGetters['auth/principalId'];

    return !!(this.principalIds || []).find((p) => p === currentPrincipal);
  }

  get principals() {
    return this.principalIds
      .map((id) => this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, id))
      .filter((p) => p);
  }

  get nameDisplay() {
    return this.displayName || this.username || this.id;
  }

  get labelForSelect() {
    const name = this.nameDisplay;
    const id = this.id;

    if ( name === id ) {
      return id;
    } else {
      return `${ name } (${ id })`;
    }
  }

  get provider() {
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
  }

  get providerDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.provider }"`, null, this.provider);
  }

  /**
   * Gets the last-login label in milliseconds
   * @returns {number}
   */
  get userLastLogin() {
    return this.metadata?.labels?.['cattle.io/last-login'] * 1000 || 0;
  }

  /**
   * Gets the disabled-after label in milliseconds
   * @returns {number}
   */
  get userDisabledIn() {
    return this.metadata?.labels?.['cattle.io/disable-after'] * 1000 || 0;
  }

  /**
   * Provides a display value for the userDisabledIn date based on the user
   * state.
   */
  get userDisabledInDisplay() {
    return this.state === 'inactive' ? null : this.userDisabledIn;
  }

  /**
   * Gets the delete-after label in milliseconds
   * @returns {number}
   */
  get userDeletedIn() {
    return this.metadata?.labels?.['cattle.io/delete-after'] * 1000 || 0;
  }

  get state() {
    if ( this.enabled === false ) {
      return 'inactive';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get stateDisplay() {
    switch (this.state) {
    case 'inactive':
      return this.t('user.state.inactive');
    case 'active':
      return this.t('user.state.active');
    case 'unknown':
      return this.t('user.state.unknown');
    default:
      return this.state;
    }
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this._description = value;
  }

  // Ensure when we clone that we preserve the description
  toJSON() {
    const data = super.toJSON();

    data.description = this._description;
    delete data._description;

    return data;
  }

  async save(opt) {
    const clone = await this.$dispatch('clone', { resource: this });

    // Remove local properties
    delete clone.canRefreshAccess;

    return clone._save(opt);
  }

  async setEnabled(enabled) {
    const clone = await this.$dispatch('rancher/clone', { resource: this.norman }, { root: true });

    clone.enabled = enabled;
    await clone.save();
  }

  async activate() {
    await this.setEnabled(true);
  }

  async activateBulk(items) {
    await Promise.all(items.map((item) => item.setEnabled(true)));
  }

  async deactivate() {
    await this.setEnabled(false);
  }

  async deactivateBulk(items) {
    await Promise.all(items.map((item) => item.setEnabled(false)));
  }

  async refreshGroupMembership() {
    const user = await this.$dispatch('rancher/find', {
      type: NORMAN.USER,
      id:   this.id,
    }, { root: true });

    await user.doAction('refreshauthprovideraccess');
  }

  canActivate(state) {
    const stateOk = state ? this.state === 'inactive' : this.state === 'active';
    const permissionOk = this.hasLink('update'); // Not canUpdate, only gate on api not whether editable pages should be visible

    return stateOk && permissionOk && !this.isCurrentUser;
  }

  get _availableActions() {
    return [
      {
        action:     'activate',
        label:      this.t('action.enable'),
        icon:       'icon icon-play',
        bulkable:   true,
        bulkAction: 'activateBulk',
        enabled:    this.canActivate(true),
        weight:     2
      },
      {
        action:     'deactivate',
        label:      this.t('action.disable'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    this.canActivate(false),
        weight:     1
      },
      {
        action:  'refreshGroupMembership',
        label:   this.t('authGroups.actions.refresh'),
        icon:    'icon icon-refresh',
        enabled: this.canRefreshAccess
      },
      { divider: true },
      ...super._availableActions,
    ];
  }

  get details() {
    return [
      {
        label:     this.t('user.detail.username'),
        formatter: 'CopyToClipboard',
        content:   this.username
      },
      { separator: true },
      {
        label:         this.t('tableHeaders.userLastLogin'),
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true, suffix: `${ this.t('suffix.ago') } (${ day(this.userLastLogin) })` },
        content:       this.userLastLogin,
      },
      {
        label:         this.t('tableHeaders.userDisabledIn'),
        formatter:     'LiveDate',
        formatterOpts: { isCountdown: true },
        content:       this.userDisabledInDisplay,
      },
      {
        label:         this.t('tableHeaders.userDeletedIn'),
        formatter:     'LiveDate',
        formatterOpts: { isCountdown: true },
        content:       this.userDeletedIn,
      },
      ...this._details
    ];
  }

  get confirmRemove() {
    return true;
  }

  get norman() {
    return this.$rootGetters['rancher/byId'](NORMAN.USER, this.id);
  }

  get canDelete() {
    return this.norman?.hasLink('remove') && !this.isCurrentUser;
  }

  get canUpdate() {
    return this.norman?.hasLink('update');
  }

  remove() {
    return this.norman?.remove();
  }
}
