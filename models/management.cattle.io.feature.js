import { ONE_WAY } from '@/config/features';
import HybridModel from '@/plugins/steve/hybrid-class';

export default class Feature extends HybridModel {
  get state() {
    return this.enabled ? 'active' : 'off';
  }

  get enabled() {
    return (this.spec.value !== null) ? this.spec.value : this.status.default;
  }

  get restartRequired() {
    return !this.status.dynamic;
  }

  get canYaml() {
    return false;
  }

  get canDisable() {
    return this.canUpdate && !ONE_WAY.includes(this.id);
  }

  get _availableActions() {
    const out = this._standardActions;
    const state = this.enabled;

    // Prepend action to enable or disable this feature flag
    const enableAction = {
      action:  'toggleFeatureFlag',
      label:   state ? 'Deactivate' : 'Activate',
      icon:    'icon icon-edit',
      enabled: state ? this.canDisable : this.canUpdate,
    };

    out.unshift(enableAction);

    return out;
  }

  toggleFeatureFlag(resources = this) {
    this.$dispatch('promptUpdate', resources);
  }
}
