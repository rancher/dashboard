<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { ALLOWED_SETTINGS } from '@shell/config/settings';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { VIEW_IN_API } from '@shell/store/prefs';
import Setting from '@shell/components/Setting';

export default {
  components: {
    Banner, Loading, Setting
  },

  async fetch() {
    const viewInApi = this.$store.getters['prefs/get'](VIEW_IN_API);
    const rows = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
    const t = this.$store.getters['i18n/t'];
    // Map settings from array to object keyed by id
    const settingsMap = rows.reduce((res, s) => {
      res[s.id] = s;

      return res;
    }, {});

    const settings = [];

    // Combine the allowed settings with the data from the API
    for ( const id in ALLOWED_SETTINGS ) {
      const setting = settingsMap[id];

      if ( !setting ) {
        continue;
      }

      const readonly = !!ALLOWED_SETTINGS[id].readOnly;
      const s = {
        ...ALLOWED_SETTINGS[id],
        id,
        description: t(`advancedSettings.descriptions.${ id }`),
        data:        setting,
        customized:  !readonly && setting.value && setting.value !== setting.default,
        fromEnv:     setting.fromEnv,
      };

      s.hide = s.canHide = (s.kind === 'json' || s.kind === 'multiline');

      if (s.kind === 'json') {
        s.json = JSON.stringify(JSON.parse(s.data.value || s.data.default), null, 2);
      } else if (s.kind === 'enum') {
        const v = s.data.value || s.data.default;

        s.enum = `advancedSettings.enum.${ id }.${ v }`;
      }
      // There are only 2 actions that can be enabled - Edit Setting or View in API
      // If neither is available for this setting then we hide the action menu button
      s.hasActions = (!s.readOnly || viewInApi) && setting.availableActions?.length;
      settings.push(s);
    }

    this.settings = settings;
  },

  data() {
    return { settings: null };
  },

//   computed: {
//     ...mapGetters({ t: 'i18n/t' }),
//     ...mapGetters({ options: 'action-menu/optionsArray' }),
//   },
};
</script>

<template>
  <Loading v-if="!settings" />
  <div v-else>
    <Banner
      color="warning"
      class="settings-banner"
    >
      <div>
        {{ t('advancedSettings.subtext') }}
      </div>
    </Banner>
    <div
      v-for="(setting) in settings"
      :key="setting.id"
    >
      <Setting
        :value="setting"
      />
    </div>

    <h2>
      {{ t('advancedSettings.provisioning.header') }}
    </h2>
  </div>
</template>

<style lang='scss' scoped>
.settings-banner {
  margin-top: 0;
}
// .advanced-setting {
//   border: 1px solid var(--border);
//   padding: 20px;
//   border-radius: var(--border-radius);

//   h1 {
//     font-size: 14px;
//   }
//   h2 {
//     font-size: 12px;
//     margin-bottom: 0;
//     opacity: 0.8;
//   }
// }
</style>
