<script>
import { mapGetters } from 'vuex';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { VIEW_IN_API } from '@shell/store/prefs';
import { MANAGEMENT } from '@shell/config/types';
import { HCI } from '../types';
import { allHash } from '@shell/utils/promise';
import { HCI_ALLOWED_SETTINGS, HCI_SINGLE_CLUSTER_ALLOWED_SETTING } from '../config/settings';

export default {
  components: { Banner, Loading },

  async fetch() {
    const isDev = this.$store.getters['prefs/get'](VIEW_IN_API);
    const isSingleProduct = !!this.$store.getters['isSingleProduct'];

    const hash = { harvesterSettings: this.$store.dispatch('harvester/findAll', { type: HCI.SETTING }) };

    if (isSingleProduct) {
      hash.settings = this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.CLUSTER_NETWORK)) {
      hash.clusterNetwork = this.$store.dispatch('harvester/findAll', { type: HCI.CLUSTER_NETWORK });
    }

    if (this.$store.getters['harvester/schemaFor'](MANAGEMENT.MANAGED_CHART)) {
      hash.managedcharts = this.$store.dispatch('harvester/findAll', { type: MANAGEMENT.MANAGED_CHART });
    }

    const rows = await allHash(hash);

    let allRows = [];

    if (rows.clusterNetwork) {
      allRows.push(...rows.clusterNetwork);
    }

    const monitoring = (rows.managedcharts || []).find(c => c.id === 'fleet-local/rancher-monitoring');

    if (monitoring) {
      allRows.push(...rows.managedcharts);
    }

    allRows.push(...rows.harvesterSettings);

    if (isSingleProduct) {
      allRows = [...rows.settings, ...allRows];
    }

    // Map settings from array to object keyed by id
    const settingsMap = allRows.reduce((res, s) => {
      res[s.id] = s;

      return res;
    }, {});

    const initSettings = [];
    let SETTINGS = HCI_ALLOWED_SETTINGS;

    if (isSingleProduct) {
      SETTINGS = {
        ...HCI_ALLOWED_SETTINGS,
        ...HCI_SINGLE_CLUSTER_ALLOWED_SETTING,
      };
    }

    Object.keys(SETTINGS).forEach((setting) => {
      if (!settingsMap[setting]) {
        return;
      }
      const realSetting = SETTINGS[setting]?.alias || setting;
      const s = {
        ...SETTINGS[setting],
        id:   realSetting,
        data: settingsMap[setting],
      };

      s.hide = s.canHide = (s.kind === 'json' || s.kind === 'multiline' || s.customFormatter === 'json');
      s.hasActions = !s.readOnly || isDev;
      initSettings.push(s);
    });

    this.initSettings = initSettings.sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }

      return 0;
    });
  },

  data() {
    return { initSettings: [] };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    settings() {
      return this.initSettings.map((setting) => {
        const s = setting;

        const isHarvester = s.data?.type?.includes('harvesterhci');

        if (s.kind === 'json') {
          try {
            s.json = JSON.stringify(JSON.parse(s.data.value || s.data.default || '{}'), null, 2);
          } catch (e) {
            console.error(`${ s.data.id }: wrong format`); // eslint-disable-line no-console
            s.json = {};
          }
        } else if (s.kind === 'enum') {
          const v = s.data.value || s.data.default;

          s.enum = isHarvester ? `advancedSettings.enum.harv-${ s.id }.${ v }` : `advancedSettings.enum.${ s.id }.${ v }`;
        } else if (s.kind === 'custom') {
          s.custom = s.data.customValue;
        }

        return {
          ...s,
          description: isHarvester ? `advancedSettings.descriptions.harv-${ s.id }` : `advancedSettings.descriptions.${ s.id }`,
          customized:  (!s.readOnly && s.data.value && s.data.value !== s.data.default) || s.data.hasCustomized
        };
      });
    }
  },

  methods: {
    showActionMenu(e, setting) {
      const actionElement = e.srcElement;

      this.$store.commit(`action-menu/show`, {
        resources: setting.data,
        elem:      actionElement
      });
    },

    getSettingOption(id) {
      return HCI_ALLOWED_SETTINGS.find(setting => setting.id === id);
    },

    toggleHide(s) {
      this.initSettings.find((setting) => {
        if (setting.id === s.id) {
          setting.hide = !setting.hide;
        }
      });
    }
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
          <h1>
            {{ setting.id }}
            <span v-if="setting.customized" class="modified">
              Modified
            </span>
          </h1>
          <h2 v-html="t(setting.description, {}, true)">
          </h2>
        </div>
        <div v-if="setting.hasActions" :id="setting.id" class="action">
          <button aria-haspopup="true" aria-expanded="false" type="button" class="btn btn-sm role-multi-action actions" @click="showActionMenu($event, setting)">
            <i class="icon icon-actions" />
          </button>
        </div>
      </div>
      <div value>
        <div v-if="setting.hide">
          <button class="btn btn-sm role-primary" @click="toggleHide(setting)">
            {{ t('advancedSettings.show') }} {{ setting.id }}
          </button>
        </div>
        <div v-else class="settings-value">
          <pre v-if="setting.kind === 'json'">{{ setting.json }}</pre>
          <pre v-else-if="setting.kind === 'multiline'">{{ setting.data.value || setting.data.default }}</pre>
          <pre v-else-if="setting.kind === 'enum'">{{ t(setting.enum) }}</pre>
          <pre v-else-if="setting.kind === 'custom' && setting.custom"> {{ setting.custom }}</pre>
          <pre v-else-if="setting.data.value || setting.data.default">{{ setting.data.value || setting.data.default }}</pre>
          <pre v-else class="text-muted">&lt;{{ t('advancedSettings.none') }}&gt;</pre>
        </div>
        <div v-if="setting.canHide && !setting.hide" class="mt-5">
          <button class="btn btn-sm role-primary" @click="toggleHide(setting)">
            {{ t('advancedSettings.hide') }} {{ setting.id }}
          </button>
        </div>
      </div>
      <Banner v-if="setting.data.errMessage" color="error mt-5" class="settings-banner">
        {{ setting.data.errMessage }}
      </Banner>
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
