<script>
import { MANAGEMENT } from '@shell/config/types';
import { ALLOWED_SETTINGS, PROVISIONING_SETTINGS } from '@shell/config/settings';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { VIEW_IN_API } from '@shell/store/prefs';
import Setting from '@shell/components/Setting';
import { mapGetters } from 'vuex';

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
    const provisioningSettings = [];

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

      if (PROVISIONING_SETTINGS.includes(s.id) ) {
        provisioningSettings.push(s);
      } else {
        settings.push(s);
      }
    }

    this.settings = settings;
    this.provisioningSettings = provisioningSettings;
  },

  data() {
    return { settings: null, provisioningSettings: null };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <Loading v-if="!settings" />
  <div v-else>
    <Banner
      color="warning"
      class="settings-banner"
      data-testid="global-settings-banner"
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
    <div
      v-for="(setting) in provisioningSettings"
      :key="setting.id"
    >
      <Setting
        :value="setting"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.settings-banner {
  margin-top: 0;
}
</style>
