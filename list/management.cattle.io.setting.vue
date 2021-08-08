<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@/config/types';
import { ALLOWED_SETTINGS } from '@/config/settings';
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import { DEV } from '@/store/prefs';

export default {
  components: { Banner, Loading },

  async fetch() {
    const isDev = this.$store.getters['prefs/get'](DEV);
    const rows = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
    const t = this.$store.getters['i18n/t'];
    // Map settings from array to object keyed by id
    const settingsMap = rows.reduce((res, s) => {
      res[s.id] = s;

      return res;
    }, {});

    const settings = [];

    // Combine the allowed settings with the data from the API
    Object.keys(ALLOWED_SETTINGS).forEach((setting) => {
      if (!settingsMap[setting]) {
        return;
      }
      const readonly = !!ALLOWED_SETTINGS[setting].readOnly;
      const s = {
        ...ALLOWED_SETTINGS[setting],
        id:          setting,
        description: t(`advancedSettings.descriptions.${ setting }`),
        data:        settingsMap[setting],
        customized:  !readonly && settingsMap[setting].value && settingsMap[setting].value !== settingsMap[setting].default
      };

      s.hide = s.canHide = (s.kind === 'json' || s.kind === 'multiline');
      if (s.kind === 'json') {
        s.json = JSON.stringify(JSON.parse(s.data.value || s.data.default), null, 2);
      } else if (s.kind === 'enum') {
        const v = s.data.value || s.data.default;

        s.enum = `advancedSettings.enum.${ setting }.${ v }`;
      }
      // There are only 2 actions that can be enabled - Edit Setting or View in API
      // If neither is available for this setting then we hide the action menu button
      s.hasActions = (!s.readOnly || isDev) && settingsMap[setting].availableActions?.length;
      settings.push(s);
    });
    this.settings = settings;
  },

  data() {
    return { settings: null };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    showActionMenu(e, setting) {
      const actionElement = e.srcElement;

      this.$store.commit(`action-menu/show`, {
        resources: setting.data,
        elem:      actionElement
      });
    },
  }
};
</script>

<template>
  <Loading v-if="!settings" />
  <div v-else>
    <Banner color="warning" class="settings-banner">
      <div>
        {{ t('advancedSettings.subtext') }}
      </div>
    </Banner>
    <div v-for="setting in settings" :key="setting.id" class="advanced-setting mb-20">
      <div class="header">
        <div class="title">
          <h1>{{ setting.id }}<span v-if="setting.customized" class="modified">Modified</span></h1>
          <h2>{{ setting.description }}</h2>
        </div>
        <div v-if="setting.hasActions" class="action">
          <button aria-haspopup="true" aria-expanded="false" type="button" class="btn btn-sm role-multi-action actions" @click="showActionMenu($event, setting)">
            <i class="icon icon-actions" />
          </button>
        </div>
      </div>
      <div value>
        <div v-if="setting.hide">
          <button class="btn btn-sm role-primary" @click="setting.hide = !setting.hide">
            {{ t('advancedSettings.show') }} {{ setting.id }}
          </button>
        </div>
        <div v-else class="settings-value">
          <pre v-if="setting.kind === 'json'">{{ setting.json }}</pre>
          <pre v-else-if="setting.kind === 'multiline'">{{ setting.data.value || setting.data.default }}</pre>
          <pre v-else-if="setting.kind === 'enum'">{{ t(setting.enum) }}</pre>
          <pre v-else-if="setting.data.value || setting.data.default">{{ setting.data.value || setting.data.default }}</pre>
          <pre v-else class="text-muted">&lt;{{ t('advancedSettings.none') }}&gt;</pre>
        </div>
        <div v-if="setting.canHide && !setting.hide">
          <button class="btn btn-sm role-primary" @click="setting.hide = !setting.hide">
            {{ t('advancedSettings.hide') }} {{ setting.id }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.settings-banner {
  margin-top: 0;
}
.advanced-setting {
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: var(--border-radius);

  h1 {
    font-size: 14px;
  }
  h2 {
    font-size: 12px;
    margin-bottom: 0;
    opacity: 0.8;
  }
}

.settings-value pre {
  margin: 0;
}

.header {
  display: flex;
  margin-bottom: 20px;
}

.title {
  flex: 1;
}

.modified {
  margin-left: 10px;
  border: 1px solid var(--primary);
  border-radius: 5px;
  padding: 2px 10px;
  font-size: 12px;
}
</style>
