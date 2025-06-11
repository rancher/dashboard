import { watch } from 'vue';
import { dasherize } from '@shell/utils/string';
import { NORMAN } from '@shell/config/types';

export default {
  data() {
    return {
      _init:   [],
      presets: {},
    };
  },

  mounted() {
    this.presetKey = dasherize(this.$options.name || '');

    const version = this.presetVersion;

    if (!version) {
      console.warn('Preset: version not found, skip.'); // eslint-disable-line no-console

      return;
    }

    let presets = null;

    try {
      presets = JSON.parse(window.localStorage.getItem(this.presetKey));
    } catch (error) {
      console.warn(`Preset: load presets failed, invalid presets [${ this.presetKey }]`); // eslint-disable-line no-console
    }

    if (presets?.data && presets?.user === this.user && presets?.version === version) {
      this.presets = presets;

      return;
    }

    this.presets = {
      data: {},
      user: this.user,
      version
    };
  },

  computed: {
    user() {
      const principal = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};

      return principal.loginName;
    }
  },

  methods: {
    preset(key, type) {
      if (this._init.includes(key)) {
        return;
      }

      this._init.push(key);

      if (!this.presetVersion) {
        return;
      }

      if (!this.presetKey) {
        return;
      }

      if (!this.presets?.data) {
        return;
      }

      if (this[key] === undefined) {
        return;
      }

      const preset = this.presets.data[key];

      if (preset !== undefined && typeof preset === type) { // eslint-disable-line valid-typeof
        this[key] = preset;
      }

      watch(
        () => this[key],
        (neu) => {
          this.presets.data[key] = neu;

          try {
            const presets = JSON.stringify(this.presets);

            window.localStorage.setItem(this.presetKey, presets);
          } catch (error) {
            console.warn(`Preset: save presets failed, invalid presets [${ this.presetKey }]`); // eslint-disable-line no-console
          }
        },
        { deep: true }
      );
    },
  },
};
