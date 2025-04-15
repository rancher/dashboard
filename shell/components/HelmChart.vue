
<script>
import {
  _CREATE, _EDIT, _VIEW, _IMPORT,
  CHART, FROM_CLUSTER, FROM_TOOLS, HIDE_SIDE_NAV, NAMESPACE, REPO, REPO_TYPE, VERSION, _FLAGGED
} from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import isEqual from 'lodash/isEqual';
import { mapPref, DIFF } from '@shell/store/prefs';
import { mapFeature, MULTI_CLUSTER, LEGACY } from '@shell/store/features';
import { markRaw } from 'vue';
import { Banner } from '@components/Banner';
import ButtonGroup from '@shell/components/ButtonGroup';
import ChartReadme from '@shell/components/ChartReadme';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { LabeledTooltip } from '@components/LabeledTooltip';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ResourceCancelModal from '@shell/components/ResourceCancelModal';
import Questions from '@shell/components/Questions';
import Tabbed from '@shell/components/Tabbed';
import UnitInput from '@shell/components/form/UnitInput';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import Wizard from '@shell/components/Wizard';
import ChartMixin from '@shell/mixins/chart';
import ChildHook, { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { CATALOG, MANAGEMENT, DEFAULT_WORKSPACE, CAPI } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS, PROJECT } from '@shell/config/labels-annotations';

import { exceptionToErrorsArray } from '@shell/utils/error';
import { clone, diff, get, set } from '@shell/utils/object';
import { findBy, insertAt } from '@shell/utils/array';
import { saferDump } from '@shell/utils/create-yaml';
import { LINUX, WINDOWS } from '@shell/store/catalog';
import { SETTING } from '@shell/config/settings';

export default {
  name: 'HelmChart',

  inheritAttrs: false,

  emits: [
    'cancel',
    'finish',
  ],

  components: {
    Banner,
    ButtonGroup,
    ChartReadme,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    LabeledTooltip,
    LazyImage,
    Loading,
    NameNsDescription,
    ResourceCancelModal,
    Questions,
    Tabbed,
    UnitInput,
    YamlEditor,
    Wizard
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    steps: {
      type:     Array,
      required: true
    },

    initStepIndex: {
      type:    Number,
      default: 0
    },

    editFirstStep: {
      type:    Boolean,
      default: false
    },

    showBanner: {
      type:    Boolean,
      default: true,
    },

    initialTitle: {
      type:    Boolean,
      default: true
    },

    bannerTitle: {
      type:    String,
      default: null
    },

    bannerImage: {
      type:    String,
      default: null
    },

    bannerTitleSubtext: {
      type:    String,
      default: null
    },

    headerMode: {
      type:    String,
      default: null
    },

    finishMode: {
      type:    String,
      default: 'finish'
    },

    ignoreVariables: {
      type:    Array,
      default: [],
    },

    isPlainLayout: {
      type:    Boolean,
      default: false
    },

    stepperName: {
      type:    String,
      default: ''
    },

    stepperSubtext: {
      type:    String,
      default: ''
    },

    windowsIncompatible: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
  },

  data() {
    return {
      chart:           null,
      showSlideIn:     false,
      action:          'install',
      hasReadme:       false,
      showCommandStep: true,
      requires:        [],
      warnings:        []
    };
  },

  computed: {},

  watch: {},

  created() {
  },

  methods: {}
};
</script>

<template>
  <div class="install-steps pt-20">
    <Wizard
      v-if="value"
      class="wizard"
      :class="{'windowsIncompatible': windowsIncompatible}"
      :steps="steps"
      :errors="errors"
      :edit-first-step="true"
      :banner-title="stepperName"
      :banner-title-subtext="stepperSubtext"
      :finish-mode="action"
      :header-mode="mode"
      :mode="mode"
      @cancel="$emit('cancel')"
      @finish="$emit('finish')"
    >
      <template #bannerTitleImage>
        <div>
          <div class="logo-bg">
            <LazyImage
              :src="chart ? chart.icon : ''"
              class="logo"
            />
          </div>
          <label
            v-if="windowsIncompatible"
            class="os-label"
          >
            {{ windowsIncompatible }}
          </label>
        </div>
      </template>

      <template #basics>
        <div class="mb-10">
          CIAO
        </div>
      </template>

      <!-- Pass down templates provided by the caller, will override default slots -->
      <template
        v-for="(_, slot) of $slots"
        :key="slot"
        v-slot:[slot]="scope"
      >
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>
    </Wizard>
    <!-- <div
      class="slideIn"
      :class="{'hide': false, 'slideIn__show': showSlideIn}"
    >
      <h2 class="slideIn__header">
        {{ t('catalog.install.steps.helmValues.chartInfo.label') }}
        <div class="slideIn__header__buttons">
          <div
            v-clean-tooltip="t('catalog.install.slideIn.dock')"
            class="slideIn__header__button"
            @click="showSlideIn = false; showReadmeWindow()"
          >
            <i class="icon icon-dock" />
          </div>
          <div
            class="slideIn__header__button"
            @click="showSlideIn = false"
          >
            <i class="icon icon-close" />
          </div>
        </div>
      </h2>
      <ChartReadme
        v-if="hasReadme"
        :version-info="versionInfo"
        class="chart-content__tabs"
      />
    </div> -->
  </div>
</template>

<style lang="scss" scoped>

  $title-height: 50px;
  $padding: 5px;
  $slideout-width: 35%;

  :deep() .controls-row {
    margin-top: 20px;
    position: relative;
  }

  .logo-bg {
    margin-right: 10px;
    height: $title-height;
    width: $title-height;
    background-color: white;
    border: $padding solid white;
    border-radius: calc( 3 * var(--border-radius));
    position: relative;
  }

  .logo {
    max-height: $title-height - 2 * $padding;
    max-width: $title-height - 2 * $padding;
    position: absolute;
    width: auto;
    height: auto;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
  }
</style>
