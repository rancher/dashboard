import { mapGetters } from 'vuex';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { findBy } from '@shell/utils/array';
import { createCssVars } from '@shell/utils/color';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';
import { setTitle } from '@shell/config/private-label';

const cspAdaptorApp = ['rancher-csp-adapter', 'rancher-csp-billing-adapter'];

export const hasCspAdapter = (apps) => {
  return apps?.find((a) => cspAdaptorApp.includes(a.metadata?.name));
};

export default {
  async fetch() {
    // For the login page, the schemas won't be loaded - we don't need the apps in this case
    try {
      if (this.$store.getters['management/canList'](CATALOG.APP)) {
        this.apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });
      }
    } catch (e) {}

    // Ensure we read the settings even when we are not authenticated
    try {
      this.globalSettings = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
        }
      });
    } catch (e) {}

    // Setting this up front will remove `computed` churn, and we only care that we've initialised them
    this.haveAppsAndSettings = !!this.apps && !!this.globalSettings;
  },

  data() {
    return {
      apps: null, globalSettings: null, haveAppsAndSettings: null
    };
  },

  computed: {
    ...mapGetters({ loggedIn: 'auth/loggedIn' }),

    brand() {
      const setting = findBy(this.globalSettings, 'id', SETTING.BRAND);

      return setting?.value;
    },

    color() {
      const setting = findBy(this.globalSettings, 'id', SETTING.PRIMARY_COLOR);

      return setting?.value;
    },

    linkColor() {
      const setting = findBy(this.globalSettings, 'id', SETTING.LINK_COLOR);

      return setting?.value;
    },

    theme() {
      const setting = findBy(this.globalSettings, 'id', SETTING.THEME);

      // This handles cases where the settings update after the page loads (like on log out)
      if (setting?.value) {
        return setting?.value;
      }

      return this.$store.getters['prefs/theme'];
    },

    cspAdapter() {
      if (!this.canCalcCspAdapter) {
        // We only have a watch on cspAdapter to kick off persisting the brand setting.
        // So we need to ensure we don't return an undefined here... which would match the undefined gave if no csp app was found...
        // .. and wouldn't kick off the watcher
        return '';
      }

      // Note! this used to be `findBy(this.app)` however for that case we lost reactivity on the collection
      // (computed fires before fetch, fetch happens and update apps, computed would not fire again - even with vue.set)
      // So use `.find` in method instead
      return hasCspAdapter(this.apps);
    },

    canCalcCspAdapter() {
      // We need to take consider the loggedIn state, as the brand mixin is used in the logout page where we can be in a mixed state
      // (things in store but user has no auth to make changes)
      return this.loggedIn && this.haveAppsAndSettings;
    }
  },

  watch: {
    color(neu) {
      if (neu) {
        this.setCustomColor(neu);
      } else {
        this.removeCustomColor();
      }
    },
    linkColor(neu) {
      if (neu) {
        this.setCustomColor(neu, 'link');
      } else {
        this.removeCustomColor('link');
      }
    },
    theme() {
      if (this.color) {
        this.setCustomColor(this.color);
      }
      if (this.linkColor) {
        this.setCustomColor(this.linkColor, 'link');
      }
      this.setBodyClass();
    },

    cspAdapter(neu) {
      if (!this.canCalcCspAdapter) {
        return;
      }

      // The brand setting will only get updated if...
      if (neu && !this.brand) {
        // 1) There should be a brand... but there's no brand setting
        const brandSetting = findBy(this.globalSettings, 'id', SETTING.BRAND);

        if (brandSetting) {
          brandSetting.value = 'csp';
          brandSetting.save();
        } else {
          const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
          const url = schema?.linkFor('collection');

          if (url) {
            this.$store.dispatch('management/create', {
              type: MANAGEMENT.SETTING, metadata: { name: SETTING.BRAND }, value: 'csp', default: ''
            }).then((setting) => setting.save());
          }
        }
      }
    },
    brand() {
      this.setBodyClass();
    }

  },
  mounted() {
    this.setBodyClass();
    setTitle();
  },
  methods: {
    setCustomColor(color, name = 'primary') {
      const vars = createCssVars(color, this.theme, name);

      for (const prop in vars) {
        document.body.style.setProperty(prop, vars[prop]);
      }
    },

    removeCustomColor(name = 'primary') {
      const vars = createCssVars('rgb(0,0,0)', this.theme, name);

      for (const prop in vars) {
        document.body.style.removeProperty(prop);
      }
    },
    setBodyClass() {
      const body = document.getElementsByTagName('body')[0];
      const cssClass = `overflow-hidden dashboard-body`;
      let bodyClass = `theme-${ this.theme } ${ cssClass }`;

      if ( this.brand ) {
        try {
          const brandMeta = require(`~shell/assets/brand/${ this.brand }/metadata.json`);

          if (brandMeta?.hasStylesheet === 'true') {
            bodyClass = `${ cssClass } ${ this.brand } theme-${ this.theme }`;
          } else {
            bodyClass = `theme-${ this.theme } overflow-hidden dashboard-body`;
            this.$store.dispatch('prefs/setBrandStyle', this.theme === 'dark');
          }
        } catch {}
      }
      body.className = bodyClass;
    }
  }

};
