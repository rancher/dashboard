<script>
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { fetchOrCreateSetting, SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import KeyValue from '@shell/components/form/KeyValue';
import { allHash } from '@shell/utils/promise';
import { mapGetters } from 'vuex';
import { isRancherPrime } from '@shell/config/version';
import KeyValueView from '@shell/components/KeyValueView';
import { Checkbox } from '@components/Form/Checkbox';

const DEFAULT_CUSTOM_LINKS = [
  {
    order:    1,
    key:      'customLinks.defaults.docs',
    value:    'https://rancher.com/docs/rancher/v2.6/en',
    enabled: true,
    default:  true
  },
  {
    order:    2,
    key:      'customLinks.defaults.forums',
    value:    'https://forums.rancher.com/',
    enabled: true,
    default:  true
  },
  {
    order:    3,
    key:      'customLinks.defaults.slack',
    value:    'https://slack.rancher.io/',
    enabled: true,
    default:  true

  },
  {
    order:    5,
    key:      'customLinks.defaults.getStarted',
    value:    '/docs/getting-started',
    enabled: true,
    default:  true

  }

];

const DEFAULT_SUPPORT_LINK = {
  order:    4,
  key:      'customLinks.defaults.issues',
  value:    'https://github.com/rancher/dashboard/issues/new',
  enabled: true,
  default:  true

};

const COMMUNITY_LINKS = [
  {
    order:    99,
    key:      'customLinks.defaults.commercialSupport',
    value:    '/support',
    enabled: true,
    default:  true
  }
];

export default {
  layout:     'authenticated',
  components: {
    KeyValue,
    Loading,
    AsyncButton,
    Banner,
    KeyValueView,
    Checkbox
  },
  async fetch() {
    try {
      const { uiIssuesSetting, uiCommunitySetting } = await allHash({
        uiIssuesSetting:    this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES }),
        uiCommunitySetting: this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.COMMUNITY_LINKS })
      });

      this.uiIssuesSetting = uiIssuesSetting;
      this.uiCommunitySetting = uiCommunitySetting;
    } catch {}

    try {
      const defaultIssueLink = !!this.uiIssuesSetting.value ? { key: this.t('customLinks.defaults.issues'), value: this.uiIssuesSetting.value } : DEFAULT_SUPPORT_LINK;
      const defaultLinks = this.multiWithFallback([...DEFAULT_CUSTOM_LINKS, defaultIssueLink, ...COMMUNITY_LINKS]);

      this.uiCustomLinks = await fetchOrCreateSetting(this.$store, SETTING.UI_CUSTOM_LINKS, JSON.stringify(defaultLinks));

      await this.deprecateIssueLinks();
    } catch {}

    this.value = JSON.parse(this.uiCustomLinks.value);
  },

  data() {
    return {
      defaultsDisabled:    true,
      isRancherPrime:     isRancherPrime(),
      uiCustomLinks:      {},
      bannerVal:          {},
      value:              [],
      errors:             [],
      showRestoredBanner: false
    };
  },
  computed: {
    ...mapGetters({ multiWithFallback: 'i18n/multiWithFallback' }),

    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    allValues() {
      return [...this.defaultLinks, ...this.customLinks];
    },

    customLinks: {
      get() {
        return this.value.filter(item => !item.default);
      },

      set(neu) {
        this.$set(this, 'value', [...this.defaultLinks, ...neu]);
      }

    },
    defaultLinks: {
      get() {
        const defaults = this.value.filter(item => !!item.default);

        return defaults.length ? defaults : this.multiWithFallback([...DEFAULT_CUSTOM_LINKS, DEFAULT_SUPPORT_LINK, ...COMMUNITY_LINKS]);
      },

      set(neu) {
        this.$set(this, 'value', [...neu, ...this.customLinks]);
      }
    }
  },
  methods: {

    showhide(row, i, e) {
      const value = this.defaultLinks[i];

      this.$set(this.value, i, { ...value, enabled: !value.enabled });
      this.defaultLinks[i] = this.value[i];
    },

    deprecateIssueLinks() {
      if (this.uiIssuesSetting.value || this.uiIssuesSetting.value) {
        this.uiIssuesSetting.value = '';
        this.uiCommunitySetting.value = '';

        return this.uiIssuesSetting.save();
      }
    },

    async save(btnCB) {
      this.uiCustomLinks.value = JSON.stringify(this.allValues);
      this.errors = [];
      try {
        await this.uiCustomLinks.save();
        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    },
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner v-if="showRestoredBanner" :color="'success'" label="Default restored" :closable="true" :label-key="'customLinks.restoreSuccess'" />
    <h1
      class="mb-20"
    >
      {{ t("customLinks.label") }}
    </h1>
    <div>
      <label class="text-label">
        {{ t(`customLinks.description`, {}, true) }}
      </label>
      <div class="ui-links-setting mt-20">
        <KeyValueView
          v-model="defaultLinks"
          :title="'Default Links'"
          :as-map="false"
          :key-label="t('customLinks.settings.keyLabel')"
          :value-label="t('customLinks.settings.valueLabel')"
          :add-label="t('customLinks.addLink')"
          :read-allowed="false"
          :protip="false"
          :mode="mode"
          :has-action="true"
        >
          <template #key="{row, i}">
            <div
              class="kv-item key"
              :index="i"
            >
              {{ row.key }}
            </div>
          </template>
          <template #value="{row, i}">
            <div
              class="kv-item key"
              :index="i"
            >
              {{ row.value }}
            </div>
          </template>
          <template #rowaction="{row, i}">
            <div class="action">
              <Checkbox v-model="row.enabled" label="Show" @input="showhide(row, i, $event)" />
            </div>
          </template>
        </KeyValueView>
      </div>
    </div>
    <div class="mt-20">
      <KeyValue
        v-model="customLinks"
        :title="'Custom Links'"
        :as-map="false"
        :key-label="t('customLinks.settings.keyLabel')"
        :value-label="t('customLinks.settings.valueLabel')"
        :add-label="t('customLinks.addLink')"
        :read-allowed="false"
        :protip="false"
        :mode="mode"
      >
      </KeyValue>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div v-if="mode === 'edit'" class="mt-20">
      <AsyncButton class="pull-right" mode="apply" @click="save" />
    </div>
  </div>
</template>
<style scoped lang='scss'>
.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--overlay-bg);
  z-index: 1;
}
.ui-links-setting {
  P {
    line-height: 1.25;
    margin-bottom: 10px;
  }

  .underline {
    text-decoration: underline;
  }
}
.action {
  display: flex;
  input {
    margin-right: 5px;
  }
}
</style>
