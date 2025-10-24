import NormanModel from '@shell/plugins/steve/norman-class';
import Resource, { DNS_LIKE_TYPES, colorForState, stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default class HostedProvider extends Resource {
  get nameDisplay() {
    return this.name;
  }

  set nameDisplay(name) {
    this.name = name;
  }

  get stateColor() {
    if (!this.active) {
      return colorForState(STATES_ENUM.INACTIVE);
    }

    return colorForState(STATES_ENUM.ACTIVE);
  }

  get stateDisplay() {
    if (!this.active) {
      return stateDisplay(STATES_ENUM.INACTIVE);
    }

    return stateDisplay(STATES_ENUM.ACTIVE);
  }

  get _availableActions() {
    const out = [
      {
        action:     'activate',
        label:      this.t('action.activate'),
        icon:       'icon icon-play',
        bulkable:   true,
        bulkAction: 'activateBulk',
        enabled:    !this.active
      },
      {
        action:     'deactivate',
        label:      this.t('action.deactivate'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    !!this.active,
        weight:     -1
      }
    ];

    return out;
  }

  async deactivate(resources = [this]) {
    await this._toggleActive(resources, false);
  }

  deactivateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { drivers: resources, driverType: 'kontainerDrivers' },
      component:      'DeactivateDriverDialog'
    });
  }

  async activate(resources = [this]) {
    await this._toggleActive(resources, true);
  }

  async activateBulk(resources) {
    await Promise.all(resources.map((resource) => this.$dispatch('rancher/request', {
      url:    `v3/kontainerDrivers/${ escape(resource.id) }?action=activate`,
      method: 'post',
    }, { root: true }).catch((err) => {
      this.$dispatch('growl/fromError', { title: this.t('drivers.error.activate', { name: resource.nameDisplay }), err }, { root: true });
    })));
  }

  async _toggleActive(resources, active) {
    const setting = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.KEV2_OPERATORS);

    if (!setting) {
      this.$dispatch('growl/error', {
        title:   this.t('generic.error'),
        message: this.t('drivers.error.missingSetting', null, true) || 'Cannot find drivers setting'
      }, { root: true });

      return;
    }

    try {
      const providerTypes = setting.value ? JSON.parse(setting.value) : [];
      const resourceIdsToToggle = new Set(resources.map((r) => r.id));

      providerTypes.forEach((provider) => {
        if (resourceIdsToToggle.has(provider.name)) {
          provider.active = active;
        }
      });

      setting.value = JSON.stringify(providerTypes);
      await setting.save();
      await this.$dispatch('rancher/findAll', { type: this.type, force: true }, { root: true });
    } catch (err) {
      const action = active ? 'activate' : 'deactivate';

      this.$dispatch('growl/fromError', { title: this.t(`drivers.error.${ action }`, { count: resources.length }), err }, { root: true });
    }
  }
}
