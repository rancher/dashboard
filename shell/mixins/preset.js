import { watch } from 'vue';
import { decamelize } from '@shell/utils/string';

export default {

  data() {
    return {
      _init:   [],
      presets: {}
    };
  },

  mounted() {
    this.presetKey = `R_${ decamelize(this.$options.name || '').toUpperCase() }`;

    const version = this.presetVersion;

    if (!version) {
      console.warn('Preset: version not found, skip.'); // eslint-disable-line no-console

      return;
    }

    const presets = this.$cookies.get(this.presetKey);

    if (presets?.data && presets?.version === version) {
      this.presets = presets;
    } else {
      this.presets = {
        data: {},
        version
      };
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

          this.$cookies.set(this.presetKey, this.presets);
        },
        { deep: true }
      );
    },
  },
};
