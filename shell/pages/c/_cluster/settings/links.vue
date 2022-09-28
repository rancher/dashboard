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

const DEFAULT_CUSTOM_LINKS = [
  {
    order: 1,
    key:   'customLinks.defaults.docs',
    value: 'https://rancher.com/docs/rancher/v2.6/en'
  },
  {
    order: 2,
    key:   'customLinks.defaults.forums',
    value: 'https://forums.rancher.com/'

  },
  {
    order: 3,
    key:   'customLinks.defaults.slack',
    value: 'https://slack.rancher.io/'
  },
  {
    order: 5,
    key:   'customLinks.defaults.getStarted',
    value: '/docs/getting-started'
  }

];

const DEFAULT_SUPPORT_LINK = {
  order: 4,
  key:   'customLinks.defaults.issues',
  value: 'https://github.com/rancher/dashboard/issues/new'
};

const COMMUNITY_LINKS = [
  {
    order: 99,
    key:   'customLinks.defaults.commercialSupport',
    value: '/support'
  }
];

export default {
  layout:     'authenticated',
  components: {
    KeyValue,
    Loading,
    AsyncButton,
    Banner,
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

    const sValue = this.uiCustomLinks?.value || JSON.stringify(this.multiWithFallback([...DEFAULT_CUSTOM_LINKS]));

    this.value = JSON.parse(sValue);
  },
  data() {
    return {
      uiCustomLinks:      {},
      bannerVal:          {},
      value:              {},
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

    defaultLinks: {
      get(issueLink) {
        if ( issueLink ) {
          return this.multiWithFallback([...DEFAULT_CUSTOM_LINKS, issueLink, ...DEFAULT_CUSTOM_LINKS]);
        }

        return this.multiWithFallback([...DEFAULT_CUSTOM_LINKS, DEFAULT_SUPPORT_LINK, ...DEFAULT_CUSTOM_LINKS]);
      }
    }

  },
  methods: {
    useDefaults() {
      const nonCommercialRancherLinks = this.isCommercial ? [] : COMMUNITY_LINKS;

      this.value = this.multiWithFallback([...DEFAULT_CUSTOM_LINKS, DEFAULT_SUPPORT_LINK, ...nonCommercialRancherLinks]);

      this.showRestoredBanner = true;

      setTimeout(() => {
        this.showRestoredBanner = false;
      }, 10000);
    },

    deprecateIssueLinks() {
      if (this.uiIssuesSetting.value || this.uiIssuesSetting.value) {
        this.uiIssuesSetting.value = '';
        this.uiCommunitySetting.value = '';

        return this.uiIssuesSetting.save();
      }
    },

    async save(btnCB) {
      this.uiCustomLinks.value = JSON.stringify(this.value);
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
        <KeyValue
          v-model="value"
          :as-map="false"
          :key-label="t('customLinks.settings.keyLabel')"
          :value-label="t('customLinks.settings.valueLabel')"
          :add-label="t('customLinks.addLink')"
          :mode="mode"
          :read-allowed="false"
          :protip="false"
        />
      </div>
    </div>
    <template v-for="err in errors">
      <Banner :key="err" color="error" :label="err" />
    </template>
    <div v-if="mode === 'edit'" class="mt-20">
      <AsyncButton class="pull-right" mode="apply" @click="save" />
      <button class="pull-right btn role-secondary mr-10" @click="useDefaults">
        {{ t('customLinks.restoreDefaults') }}
      </button>
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
.input {
  max-width: 25%;
}
</style>
