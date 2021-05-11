export default {
  props: {
    pref: {
      type:    String,
      default: null,
    },
    prefKey: {
      type:    String,
      default: null,
    }
  },

  computed: {
    shown() {
      let shown = true;

      if (this.pref) {
        const prefData = this.$store.getters['prefs/get'](this.pref);

        if (this.prefKey) {
          shown = !prefData[this.prefKey];
        } else {
          shown = !prefData;
        }
      }

      return shown;
    }
  },

  methods: {
    async hide() {
      if (this.pref) {
        let value = this.$store.getters['prefs/get'](this.pref);

        // Set the preference to store that the panel is hidden
        if (this.prefKey) {
          if (value === true || value === false || value.length > 0) {
            value = {};
          }
          value[this.prefKey] = true;
        }
        await this.$store.dispatch('prefs/set', { key: this.pref, value });
      }
    }
  },
};
