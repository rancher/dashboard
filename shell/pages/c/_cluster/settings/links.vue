<script>
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { fetchOrCreateSetting } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import KeyValue from '@shell/components/form/KeyValue';
import { mapGetters } from 'vuex';
import { isRancherPrime } from '@shell/config/version';
import DefaultLinksEditor from './DefaultLinksEditor';
import { CUSTOM_LINKS_APP_CO_VERSION, fetchLinks } from '@shell/config/home-links';
import TabTitle from '@shell/components/TabTitle';

export default {
  components: {
    KeyValue,
    Loading,
    AsyncButton,
    Banner,
    DefaultLinksEditor,
    TabTitle
  },
  async fetch() {
    this.value = await fetchLinks(this.$store, this.hasSupport, false, (str) => this.t(str));
  },

  data() {
    return {
      defaultsDisabled: true,
      isRancherPrime:   isRancherPrime(),
      uiCustomLinks:    {},
      bannerVal:        {},
      value:            [],
      errors:           [],
    };
  },
  computed: {
    ...mapGetters({ multiWithFallback: 'i18n/multiWithFallback' }),

    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    allValues() {
      return {
        version:  CUSTOM_LINKS_APP_CO_VERSION,
        defaults: this.value.defaults.filter((obj) => obj.enabled).map((obj) => obj.key),
        custom:   this.value.custom
      };
    },

    hasSupport() {
      return isRancherPrime() || this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },
  },
  methods: {
    deprecateIssueLinks() {
      if (this.uiIssuesSetting.value || this.uiIssuesSetting.value) {
        this.uiIssuesSetting.value = '';
        this.uiCommunitySetting.value = '';

        return this.uiIssuesSetting.save();
      }
    },

    async save(btnCB) {
      this.errors = [];
      try {
        const uiCustomLinks = await fetchOrCreateSetting(this.$store, SETTING.UI_CUSTOM_LINKS, '');

        uiCustomLinks.value = JSON.stringify(this.allValues);

        await uiCustomLinks.save();

        this.value = await fetchLinks(this.$store, this.hasSupport, false, (str) => this.t(str));
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
      <TabTitle>{{ t("customLinks.label") }}</TabTitle>
    </h1>
    <div>
      <label class="text-label">
        {{ t(`customLinks.description`, {}, true) }}
      </label>
    </div>
    <div class="mt-20">
      <KeyValue
        v-model:value="value.custom"
        :title="'Custom Links'"
        :as-map="false"
        key-name="label"
        :key-label="t('customLinks.settings.keyLabel')"
        :value-label="t('customLinks.settings.valueLabel')"
        :add-label="t('customLinks.addLink')"
        :read-allowed="false"
        :protip="false"
        :mode="mode"
      />
    </div>
    <div class="ui-links-setting mt-20">
      <DefaultLinksEditor
        v-model:value="value.defaults"
        :mode="mode"
      />
    </div>
    <template
      v-for="(err, i) in errors"
      :key="i"
    >
      <Banner
        color="error"
        :label="err"
      />
    </template>
    <div
      v-if="mode === 'edit'"
      class="mt-20"
    >
      <AsyncButton
        class="pull-right"
        mode="apply"
        @click="save"
      />
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
