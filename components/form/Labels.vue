<script>
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    displaySideBySide: {
      type:    Boolean,
      default: false,
    },
    defaultContainerClass: {
      type:    String,
      default: '',
    }
  },

  computed: {
    containerClass() {
      const { defaultContainerClass } = this;

      return this.displaySideBySide ? `row ${ defaultContainerClass }` : `${ defaultContainerClass }`;
    },

    sectionClass() {
      return this.displaySideBySide ? 'col span-6' : 'row';
    }
  },

  created() {
    if ( !this.value.metadata ) {
      this.$set(this.value, 'metadata', {});
    }

    if ( !this.value.annotations ) {
      this.$set(this.value, 'annotations', {});
    }
  },
};
</script>
<template>
  <div :class="containerClass">
    <div :class="sectionClass">
      <KeyValue
        key="labels"
        v-model="value.metadata.labels"
        :mode="mode"
        title="Labels"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </div>
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        v-model="value.metadata.annotations"
        :mode="mode"
        title="Annotations"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </div>
  </div>
</template>
