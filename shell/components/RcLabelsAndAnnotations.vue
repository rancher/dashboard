<script>
import RcLabels from '@shell/components/form/RcLabels.vue';
import { Factory } from '@shell/components/form/Labels.vue';
import { RcSection, SECTION_TYPE } from '@components/RcSection';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { LABELS_TO_IGNORE_REGEX, ANNOTATIONS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import { _VIEW } from '@shell/config/query-params';

export default {
  emits: ['update:value', 'input'],

  components: {
    RcLabels, RcSection, ToggleSwitch
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

    expandable: {
      type:    Boolean,
      default: true,
    },

    expanded: {
      type:    Boolean,
      default: true,
    },
  },

  data() {
    return { SECTION_TYPE, showSystemKeys: false };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },

    hasProtectedKeys() {
      const labels = new Factory(this.value.systemLabels, LABELS_TO_IGNORE_REGEX, '', this.value.labels);
      const annotations = new Factory(
        this.value.systemAnnotations,
        ANNOTATIONS_TO_IGNORE_REGEX,
        '',
        this.value.annotations,
        this.value.allowedSystemAnnotationKeys
      );

      return labels.hasProtectedKeys || annotations.hasProtectedKeys;
    },

    showToggler() {
      return this.mode === _VIEW && this.hasProtectedKeys;
    },
  },
};
</script>

<template>
  <RcSection
    :title="t('generic.labelsAndAnnotations', {}, true)"
    mode="with-header"
    :type="SECTION_TYPE.PRIMARY"
    :expandable="expandable"
    :expanded="expanded"
  >
    <ToggleSwitch
      v-if="showToggler"
      v-model:value="showSystemKeys"
      name="label-system-toggle"
      :on-label="t('labels.labels.show')"
    />
    <RcSection
      :title="t('labels.labels.title')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      :expandable="true"
    >
      <RcLabels
        v-model:value="localValue"
        :mode="mode"
        :show-label-title="false"
        :show-annotations="false"
        :show-system-keys="showSystemKeys"
        @input="$emit('input', $event)"
      />
    </RcSection>

    <RcSection
      :title="t('labels.annotations.title')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      :expandable="true"
    >
      <RcLabels
        v-model:value="localValue"
        :mode="mode"
        :show-labels="false"
        :show-annotation-title="false"
        :show-system-keys="showSystemKeys"
        @input="$emit('input', $event)"
      />
    </RcSection>
  </RcSection>
</template>
