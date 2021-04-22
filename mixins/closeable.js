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
    hide() {
      if (this.pref) {
        let value = this.shown;

        // Set the preference to store that the panel is hidden
        if (this.prefKey) {
          value = this.$store.getters['prefs/get'](this.pref);
          if (value === true || value === false || value.length > 0) {
            value = {};
          }
          value[this.prefKey] = true;
        }
        this.$store.dispatch('prefs/set', { key: this.pref, value });
      }
    }
  },
};
