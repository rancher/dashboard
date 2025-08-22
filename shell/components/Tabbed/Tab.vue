<script>
import { useTabCountWatcher } from '@shell/components/form/ResourceTabs/composable';

export default {
  inject: ['addTab', 'removeTab', 'sideTabs'],

  emits: ['active'],

  props: {
    label: {
      default: null,
      type:    String
    },
    labelKey: {
      default: null,
      type:    String
    },
    name: {
      required: true,
      type:     String
    },
    tooltip: {
      default: null,
      type:    [String, Object]
    },
    weight: {
      default:  0,
      required: false,
      type:     Number
    },
    showHeader: {
      type:    Boolean,
      default: null, // Default true for side-tabs, false for top.
    },
    displayAlertIcon: {
      type:    Boolean,
      default: null
    },
    error: {
      type:    Boolean,
      default: false
    },
    badge: {
      default:  0,
      required: false,
      type:     Number
    },
    /**
     * False to hide the count from being displayed in a tab.
     * Number override/display the number as the count on the tab.
     */
    count: {
      default: undefined,
      type:    [Number, Boolean]
    }
  },

  setup(props) {
    const { count, isCountVisible } = useTabCountWatcher();

    return { inferredCount: count, isInferredCountVisible: isCountVisible };
  },

  data() {
    return { active: null };
  },

  computed: {
    baseLabelDisplay() {
      if ( this.labelKey ) {
        return this.$store.getters['i18n/t'](this.labelKey);
      }

      if ( this.label ) {
        return this.label;
      }

      return this.name;
    },

    labelDisplay() {
      const baseLabel = this.baseLabelDisplay;

      if ( this.displayCount === false ) {
        return baseLabel;
      }

      return `${ baseLabel } (${ this.displayCount })`;
    },

    shouldShowHeader() {
      if ( this.showHeader !== null ) {
        return this.showHeader;
      }

      return this.sideTabs || false;
    },

    displayCount() {
      if (this.count === false) {
        return false;
      }

      if (typeof this.count === 'number') {
        return this.count;
      }

      if (this.isInferredCountVisible) {
        return this.inferredCount;
      }

      return false;
    }
  },

  watch: {
    active(neu) {
      if (neu) {
        this.$emit('active');
      }
    }
  },

  mounted() {
    this.addTab(this);
  },

  beforeUnmount() {
    this.removeTab(this);
  }
};
</script>

<template>
  <section
    v-show="active"
    :id="name"
    :aria-hidden="!active"
    role="tabpanel"
  >
    <div
      v-if="shouldShowHeader"
      class="tab-header"
    >
      <h2>
        {{ labelDisplay }}
        <i
          v-if="tooltip"
          v-clean-tooltip="tooltip"
          class="icon icon-info icon-lg"
        />
      </h2>
      <slot name="tab-header-right" />
    </div>
    <slot v-bind="{active}" />
  </section>
</template>

<style lang="scss" scoped>
.tab-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;

  h2 {
    margin: 0;

  }
}
</style>
