import { NORMAN } from '@shell/config/types';
import HybridModel, { cleanHybridResources } from '@shell/plugins/steve/hybrid-class';
import {
  _getDescription, _getLabelForSelect, _getNameDisplay, _getProvider, _getProviderDisplay
} from '@shell/plugins/steve/resourceUtils/management.cattle.io.user';

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
    for ( const principal of this.principalIds || [] ) {
      if ( principal.startsWith('system://') ) {
        return true;
      }
    }

    return false;
  }

  get isCurrentUser() {
    const currentPrincipal = this.$rootGetters['auth/principalId'];

    return !!(this.principalIds || []).find(p => p === currentPrincipal);
  }

  get principals() {
    return this.principalIds
      .map(id => this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, id))
      .filter(p => p);
  }

  get nameDisplay() {
    return _getNameDisplay(this);
  }

  get labelForSelect() {
    return _getLabelForSelect(this);
  }

  get provider() {
    return _getProvider(this);
  }

  get providerDisplay() {
    return _getProviderDisplay(this, { translateWithFallback: this.$rootGetters['i18n/withFallback'] });
  }

  get state() {
    if ( this.enabled === false ) {
      return 'inactive';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get description() {
    return _getDescription(this);
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
    await Promise.all(items.map(item => item.setEnabled(true)));
  }

  async deactivate() {
    await this.setEnabled(false);
  }

  async deactivateBulk(items) {
    await Promise.all(items.map(item => item.setEnabled(false)));
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
