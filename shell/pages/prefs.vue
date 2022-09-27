<script>
import day from 'dayjs';
import { mapGetters } from 'vuex';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import ButtonGroup from '@shell/components/ButtonGroup';
import { Checkbox } from '@components/Form/Checkbox';
import LandingPagePreference from '@shell/components/LandingPagePreference';
import {
  mapPref, THEME, KEYMAP, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE, HIDE_DESC, SHOW_PRE_RELEASE, MENU_MAX_CLUSTERS,
  VIEW_IN_API, ALL_NAMESPACES, THEME_SHORTCUT
} from '@shell/store/prefs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { addObject } from '@shell/utils/array';
import LocaleSelector from '@shell/components/LocaleSelector';

export default {
  layout:     'plain',
  components: {
    BackLink, ButtonGroup, LabeledSelect, Checkbox, LandingPagePreference, LocaleSelector
  },
  mixins:     [BackRoute],
  computed:   {
    keymap:           mapPref(KEYMAP),
    viewInApi:        mapPref(VIEW_IN_API),
    allNamespaces:    mapPref(ALL_NAMESPACES),
    themeShortcut:    mapPref(THEME_SHORTCUT),
    dateFormat:       mapPref(DATE_FORMAT),
    timeFormat:       mapPref(TIME_FORMAT),
    perPage:          mapPref(ROWS_PER_PAGE),
    hideDesc:         mapPref(HIDE_DESC),
    showPreRelease:   mapPref(SHOW_PRE_RELEASE),
    menuMaxClusters:  mapPref(MENU_MAX_CLUSTERS),

    ...mapGetters(['isSingleProduct']),

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
  }
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1 v-t="'prefs.title'" class="mb-20" />
    <!-- Language -->
    <div class="mt-10 mb-10">
      <h4 v-t="'prefs.language'" />
      <div class="row">
        <div class="col span-4">
          <LocaleSelector />
        </div>
      </div>
    </div>
    <!-- Theme -->
    <div class="mt-10 mb-10">
      <hr />
      <h4 v-t="'prefs.theme.label'" />
      <ButtonGroup v-model="theme" :options="themeOptions" />
      <div class="mt-10">
        <t k="prefs.theme.autoDetail" :pm="pm" :am="am" />
      </div>
    </div>
    <!-- Login landing page -->
    <div v-if="!isSingleProduct" class="mt-10 mb-10">
      <hr />
      <h4 v-t="'prefs.landing.label'" />
      <LandingPagePreference />
    </div>
    <!-- Display Settings -->
    <div class="mt-10 mb-10">
      <hr />
      <h4 v-t="'prefs.displaySettings.title'" />
      <p class="set-landing-leadin">
        {{ t('prefs.displaySettings.detail', {}, raw=true) }}
      </p>
      <div class="row mt-20">
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
      </div>

      <div class="row mt-20">
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
    </div>
    <!-- Advanced Features -->
    <div class="col adv-features mt-10 mb-10">
      <hr />
      <h4 v-t="'prefs.advFeatures.title'" />
      <Checkbox v-model="viewInApi" :label="t('prefs.advFeatures.viewInApi', {}, true)" class="mt-10" />
      <br />
      <Checkbox v-model="allNamespaces" :label="t('prefs.advFeatures.allNamespaces', {}, true)" class="mt-20" />
      <br />
      <Checkbox v-model="themeShortcut" :label="t('prefs.advFeatures.themeShortcut', {}, true)" class="mt-20" />
      <br />
      <Checkbox v-if="!isSingleProduct" v-model="hideDescriptions" :label="t('prefs.hideDesc.label')" class="mt-20" />
    </div>
    <!-- YAML editor key mapping -->
    <div class="col mt-10 mb-10">
      <hr />
      <h4 v-t="'prefs.keymap.label'" />
      <ButtonGroup v-model="keymap" :options="keymapOptions" />
    </div>
    <!-- Helm Charts -->
    <div v-if="!isSingleProduct" class="col mt-10 mb-40">
      <hr />
      <h4 v-t="'prefs.helm.label'" />
      <ButtonGroup v-model="showPreRelease" :options="helmOptions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
  .wrap-text {
    overflow-wrap: break-word;
    max-width: 80vw;
    color: var(--input-label);
  }
</style>
