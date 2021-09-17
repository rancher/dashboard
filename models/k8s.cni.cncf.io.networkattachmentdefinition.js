import Vue from 'vue';

export default {
  _availableActions() {
    let out = this._standardActions;
    const toFilter = ['goToClone', 'cloneYaml', 'goToViewConfig', 'goToEditYaml', 'goToEdit'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return out;
  },

  applyDefaults() {
    return () => {
      const spec = this.spec || {
        config: JSON.stringify({
          cniVersion:  '0.3.1',
          name:        '',
          type:        'bridge',
          bridge:      'harvester-br0',
          promiscMode: true,
          vlan:        '',
          ipam:        {}
        })
      };

      Vue.set(this, 'spec', spec);
    };
  },

  parseConfig() {
    try {
      return JSON.parse(this.spec.config) || {};
    } catch (err) {
      return {};
    }
  },

  isIpamStatic() {
    return this.parseConfig.ipam?.type === 'static';
  },

  vlanType() {
    const type = this.parseConfig.type;

    return type === 'bridge' ? 'L2VlanNetwork' : type;
  },

  vlanId() {
    return this.parseConfig.vlan;
  },

  customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        minLength:      1,
        maxLength:      63,
        translationKey: 'harvester.fields.name'
      }
    ];

    return rules;
  },
};
