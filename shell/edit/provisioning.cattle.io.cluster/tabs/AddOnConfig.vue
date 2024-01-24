<script>
import { Banner } from '@components/Banner';

import Questions from '@shell/components/Questions';
import YamlEditor from '@shell/components/YamlEditor';
import { camelToTitle } from '@shell/utils/string';
import { _EDIT } from '@shell/config/query-params';

export default {
  components: {
    Banner,
    Questions,
    YamlEditor
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    versionInfo: {
      type:     Object,
      required: true,
    },

    addonVersions: {
      type:     Array,
      required: false,
      default:  null
    },

    addonsRev: {
      type:     Number,
      required: true,
    },
    userChartValuesTemp: {
      type:     Object,
      required: true,
    },
    initYamlEditor: {
      type:     Function,
      required: true,
    }

  },

  computed: {
    additionalManifest: {
      get() {
        return this.value.spec.rkeConfig.additionalManifest;
      },
      set(neu) {
        this.$emit('additional-manifest-changed', neu);
      }
    },
    isEdit() {
      return this.mode === _EDIT;
    },
  },

  methods: {

    labelForAddon(name) {
      const fallback = `${ camelToTitle(name.replace(/^(rke|rke2|rancher)-/, '')) } Configuration`;

      return this.$store.getters['i18n/withFallback'](`cluster.addonChart."${ name }"`, null, fallback);
    },
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="isEdit"
      color="warning"
    >
      {{ t('cluster.addOns.dependencyBanner') }}
    </Banner>
    <div
      v-if="versionInfo && addonVersions.length"
      :key="addonsRev"
    >
      <div
        v-for="v in addonVersions"
        :key="v._key"
      >
        <h3>{{ labelForAddon(v.name) }}</h3>
        <Questions
          v-if="versionInfo[v.name] && versionInfo[v.name].questions && v.name && userChartValuesTemp[v.name]"
          v-model="userChartValuesTemp[v.name]"
          :emit="true"
          in-store="management"
          :mode="mode"
          :tabbed="false"
          :source="versionInfo[v.name]"
          :target-namespace="value.metadata.namespace"
          @updated="$emit('update-questions', v.name)"
        />
        <YamlEditor
          v-else
          ref="yaml-values"
          :value="initYamlEditor(v.name)"
          :scrolling="true"
          :as-object="true"
          :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
          :hide-preview-buttons="true"
          @input="data => $emit('update-values', v.name, data)"
        />
        <div class="spacer" />
      </div>
    </div>

    <div>
      <h3>
        {{ t('cluster.addOns.additionalManifest.title') }}
        <i
          v-clean-tooltip="t('cluster.addOns.additionalManifest.tooltip')"
          class="icon icon-info"
        />
      </h3>
      <YamlEditor
        ref="yaml-additional"
        v-model="additionalManifest"
        :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
        initial-yaml-values="# Additional Manifest YAML"
        class="yaml-editor"
      />
    </div>
  </div>
</template>
