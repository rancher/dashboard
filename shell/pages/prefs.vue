<script>
import day from 'dayjs';
import { mapGetters } from 'vuex';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@shell/components/form/Checkbox';
import LandingPagePreference from '@shell/components/LandingPagePreference';
import {
  mapPref, THEME, KEYMAP, DEV, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE, HIDE_DESC, SHOW_PRE_RELEASE, MENU_MAX_CLUSTERS
} from '@shell/store/prefs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { addObject } from '@shell/utils/array';

export default {
  layout:     'plain',
  components: {
    BackLink, ButtonGroup, LabeledSelect, Checkbox, LandingPagePreference
  },
  mixins:     [BackRoute],
  computed:   {
    keymap:          mapPref(KEYMAP),
    dev:             mapPref(DEV),
    dateFormat:      mapPref(DATE_FORMAT),
    timeFormat:      mapPref(TIME_FORMAT),
    perPage:         mapPref(ROWS_PER_PAGE),
    hideDesc:        mapPref(HIDE_DESC),
    showPreRelease:  mapPref(SHOW_PRE_RELEASE),
    menuMaxClusters: mapPref(MENU_MAX_CLUSTERS),

    ...mapGetters(['isSingleVirtualCluster']),

    theme: {
      get() {
        return this.$store.getters['prefs/get'](THEME);
      },
      set(neu) {
        this.$store.dispatch('prefs/setTheme', neu);
      }
    },

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          labelKey: `prefs.theme.${ value }`,
          value
        };
      });
    },

    keymapOptions() {
      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          labelKey: `prefs.keymap.${ value }`,
          value
        };
      });
    },

    dateOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](DATE_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    helmOptions() {
      return this.$store.getters['prefs/options'](SHOW_PRE_RELEASE).map((value) => {
        return {
          labelKey: `prefs.helm.${ value }`,
          value
        };
      });
    },

    pm() {
      const time = day().hour(18).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
    },

    am() {
      const time = day().hour(6).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
    },

    timeOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](TIME_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    perPageOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map(count => ({
        label: t('prefs.perPage.value', { count }),
        value: count
      }));
    },

    menuClusterOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](MENU_MAX_CLUSTERS).map(count => ({
        label: t('prefs.clusterToShow.value', { count }),
        value: count
      }));
    },

    hideDescriptions: {
      get() {
        return this.hideDesc.includes('ALL');
      },

      set(neu) {
        let val;

        if ( neu ) {
          val = this.hideDesc.slice();
          addObject(val, 'ALL');
        } else {
          // On unset, clear all remembered individual ones too
          val = [];
        }

        this.hideDesc = val;
      }
    },
  },
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1 v-t="'prefs.title'" />

    <h4 v-t="'prefs.theme.label'" />
    <div>
      <ButtonGroup v-model="theme" :options="themeOptions" />
    </div>
    <div class="mt-10">
      <t k="prefs.theme.autoDetail" :pm="pm" :am="am" />
    </div>
    <div v-if="!isSingleVirtualCluster">
      <hr />
      <h4 v-t="'prefs.landing.label'" />
      <LandingPagePreference />
    </div>
    <hr />
    <h4 v-t="'prefs.formatting'" />
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="dateFormat"
          :label="t('prefs.dateFormat.label')"
          :options="dateOptions"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="timeFormat"
          :label="t('prefs.timeFormat.label')"
          :options="timeOptions"
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-model.number="perPage"
          :label="t('prefs.perPage.label')"
          :options="perPageOptions"
          option-key="value"
          option-label="label"
          placeholder="Select a row count"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-4">
        <LabeledSelect
          v-model.number="menuMaxClusters"
          :label="t('prefs.clusterToShow.label')"
          :options="menuClusterOptions"
          option-key="value"
          option-label="label"
          placeholder="Select a row count"
        />
      </div>
    </div>

    <hr />
    <div class="row">
      <div class="col span-8">
        <h4 v-t="'prefs.keymap.label'" />
        <ButtonGroup v-model="keymap" :options="keymapOptions" />
      </div>
      <div class="col span-4">
        <h4 v-t="'prefs.advanced'" />
        <Checkbox v-model="dev" :label="t('prefs.dev.label', {}, true)" />
        <Checkbox v-if="!isSingleVirtualCluster" v-model="hideDescriptions" :label="t('prefs.hideDesc.label')" />
      </div>
    </div>

    <div v-if="!isSingleVirtualCluster">
      <hr />
      <div class="row mb-20">
        <div class="col span-12">
          <h4 v-t="'prefs.helm.label'" />
          <ButtonGroup v-model="showPreRelease" :options="helmOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
</style>
