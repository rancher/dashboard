import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { findBy } from '@shell/utils/array';
import { createCssVars } from '@shell/utils/color';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';

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
  },

  data() {
    return { apps: [], globalSettings: [] };
  },

  computed: {

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
      return findBy(this.apps, 'metadata.name', 'rancher-csp-adapter' );
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
    },

    cspAdapter(neu) {
      if (neu && !this.brand) {
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
            }).then(setting => setting.save());
          }
        }
      } else if (!neu) {
        const brandSetting = findBy(this.globalSettings, 'id', SETTING.BRAND);

        if (brandSetting) {
          brandSetting.value = '';
          brandSetting.save();
        }
      }
    }
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
    }
  },
  head() {
    let cssClass = `overflow-hidden dashboard-body`;
    const out = {
      bodyAttrs: { class: `theme-${ this.theme } ${ cssClass }` },
      title:     getVendor(),
    };

    if (getVendor() === 'Harvester') {
      const ico = require(`~shell/assets/images/pl/harvester.png`);

      out.title = 'Harvester';
      out.link = [{
        hid:  'icon',
        rel:  'icon',
        type: 'image/x-icon',
        href: ico
      }];
    }

    let brandMeta;

    if ( this.brand ) {
      try {
        brandMeta = require(`~shell/assets/brand/${ this.brand }/metadata.json`);
      } catch {
        return out;
      }
    }

    if (brandMeta?.hasStylesheet === 'true') {
      cssClass = `${ cssClass } ${ this.brand } theme-${ this.theme }`;
    } else {
      cssClass = `theme-${ this.theme } overflow-hidden dashboard-body`;
      this.$store.dispatch('prefs/setBrandStyle', this.theme === 'dark');
    }

    out.bodyAttrs.class = cssClass;

    return out;
  },

};
