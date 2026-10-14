import { ONE_WAY } from '@shell/config/features';
import { isRancherPrime } from '@shell/config/version';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class Feature extends HybridModel {
  get state() {
    return this.enabled ? 'active' : 'off';
  }

  /**
   * A Prime feature is always off on a build that is not Prime, whatever its
   * value says - Rancher ignores it there.
   */
  get primeUnavailable() {
    return !!this.status?.prime && !isRancherPrime();
  }

  get enabled() {
    if (this.primeUnavailable) {
      return false;
    }

    // If lockedValue is not null, then this is the value that the flag is locked to, so that should be used
    if (this.status && this.status.lockedValue !== null) {
      return this.status.lockedValue;
    }

    // Otherwise, use spec.value if set, otherwise fallback to status.default
    return (this.spec.value !== null) ? this.spec.value : this.status.default;
  }

  get restartRequired() {
    return !this.status?.dynamic;
  }

  get canYaml() {
    return false;
  }

  get canDisable() {
    return this.canUpdate && !ONE_WAY.includes(this.id);
  }

  get _availableActions() {
    const out = super._availableActions;
    const state = this.enabled;

    // Prepend action to enable or disable this feature flag
    const enableAction = {
      action:  'toggleFeatureFlag',
      label:   state ? this.t('action.deactivate') : this.t('action.activate'),
      icon:    'icon icon-edit',
      enabled: state ? this.canDisable : this.canUpdate,
    };

    // User can not disable or enable if the feature flag is locked
    // Note: lockedValue is the value that the feature flag is locked to, so it can be true or false
    // It can also be null, which indicates that the feature flag is not locked
    enableAction.enabled = enableAction.enabled && (this.status && this.status.lockedValue === null) && !this.primeUnavailable;

    out.unshift(enableAction);

    return out;
  }

  toggleFeatureFlag(resources = this) {
    this.$dispatch('promptModal', {
      component:  'FeatureFlagListDialog',
      resources:  !Array.isArray(resources) ? [resources] : resources,
      modalWidth: '450',
      height:     'auto',
      styles:     'max-height: 100vh;'
    });
  }
}
