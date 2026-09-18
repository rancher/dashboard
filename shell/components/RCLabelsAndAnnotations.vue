<script>
import Labels from '@shell/components/form/Labels';
import { RcSection, SECTION_TYPE } from '@components/RcSection';

export default {
  emits: ['update:value', 'input'],

  components: { Labels, RcSection },

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
    return { SECTION_TYPE };
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
    <RcSection
      :title="t('labels.labels.title')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      :expandable="true"
    >
      <Labels
        v-model:value="localValue"
        :mode="mode"
        :display-side-by-side="false"
        :show-label-title="false"
        :show-annotations="false"
        @input="$emit('input', $event)"
      />
    </RcSection>

    <RcSection
      :title="t('labels.annotations.title')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      :expandable="true"
    >
      <Labels
        v-model:value="localValue"
        :mode="mode"
        :display-side-by-side="false"
        :show-labels="false"
        :show-annotation-title="false"
        @input="$emit('input', $event)"
      />
    </RcSection>
  </RcSection>
</template>
