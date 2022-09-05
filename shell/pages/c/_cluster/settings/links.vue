<script>
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { MANAGEMENT } from '@shell/config/types';
import { fetchOrCreateSetting, SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import KeyValue from '@shell/components/form/KeyValue';
import { allHash } from '@shell/utils/promise';

const DEFAULT_CUSTOM_LINKS = [
  {
    order: 1,
    key:   'Docs',
    value: 'https://rancher.com/docs/rancher/v2.6/en'
  },
  {
    order: 2,
    key:   'Forums',
    value: 'https://forums.rancher.com/'

  },
  {
    order: 3,
    key:   'Slack',
    value: 'https://slack.rancher.io/'
  },

];

const DEFAULT_SUPPORT_LINK = {
  order: 5,
  key:   'File an issue',
  value: 'https://github.com/rancher/dashboard/issues/new'
};

const COMMUNITY_INKS = [
  {
    order: 99,
    key:   'Commercial Support',
    value: 'https://localhost:8005/support'
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
    console.log('FETCHING');
    try {
      const reset = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_CUSTOM_LINKS });

      console.log('reset', reset);
      const remove = await reset.remove();

      console.log('?REMOVE', remove);
    } catch {}

    try {
      const { uiIssuesSetting, uiCommunitySetting } = await allHash({
        uiIssuesSetting:    this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES }),
        uiCommunitySetting: this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.COMMUNITY_LINKS })
      });

      this.uiIssuesSetting = uiIssuesSetting;
      this.uiCommunitySetting = uiCommunitySetting;
    } catch {}

    try {
      console.log(this.uiIssuesSetting);
      const defaultIssueLink = { key: 'File an issue', value: this.uiIssuesSetting.value } || DEFAULT_SUPPORT_LINK;
      const defaultLinks = [...DEFAULT_CUSTOM_LINKS, defaultIssueLink, ...COMMUNITY_INKS];

      this.uiCustomLinks = await fetchOrCreateSetting(this.$store, SETTING.UI_CUSTOM_LINKS, JSON.stringify(defaultLinks));

      await this.deprecateIssueLinks();
    } catch {}

    const sValue = this.uiCustomLinks?.value || JSON.stringify(DEFAULT_CUSTOM_LINKS);

    this.value = JSON.parse(sValue);
  },
  data() {
    return {
      uiCustomLinks: {},
      bannerVal:     {},
      value:         {},
      errors:        [],
    };
  },
  computed: {
    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    migratedLinks() {
      return '';
    },

    defaultLinks: {
      get(issueLink) {
        if ( issueLink ) {
          return [...DEFAULT_CUSTOM_LINKS, issueLink, ...DEFAULT_CUSTOM_LINKS];
        }

        return [...DEFAULT_CUSTOM_LINKS, DEFAULT_SUPPORT_LINK, ...DEFAULT_CUSTOM_LINKS];
      }
    }

  },
  methods: {
    useDefaults() {
      const nonCommercialRancherLinks = this.isCommercial ? [] : COMMUNITY_INKS;

      this.value = [...DEFAULT_CUSTOM_LINKS, DEFAULT_SUPPORT_LINK, ...nonCommercialRancherLinks];
    },

    cancel() {
      this.done();
    },

    deprecateIssueLinks() {
      if (this.uiIssuesSetting.value || this.uiIssuesSetting.value) {
        this.uiIssuesSetting.value = '';
        this.uiCommunitySetting.value = '';

        return Promise.all([
          this.uiIssuesSetting.save(),
          this.uiIssuesSetting.save()
        ]);
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
    <h1 class="mb-20">
      {{ t("customLinks.label") }}
    </h1>
    <div>
      <label class="text-label">
        {{ t(`customLinks.description`, {}, true) }}
      </label>
      <!-- Incremental Loading -->
      <div class="ui-links-setting">
        <KeyValue
          v-model="value"
          :as-map="false"
          :key-label="'text'"
          :value-label="'URL'"
          :add-label="t('labels.addLabel')"
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
        Restore default
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
