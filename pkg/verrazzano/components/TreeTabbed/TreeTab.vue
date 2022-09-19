<script>
// Added by Verrazzano

import NavigationHelper from '@pkg/mixins/navigation-helper';

export default {
  inject: ['addTab', 'removeTab', 'addNavigation', 'removeNavigation', 'openNavigation'],
  mixins: [NavigationHelper],

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
    showNavChildren: {
      default: undefined,
      type:    Boolean
    },
    showHeader: {
      type:    Boolean,
      default: true
    },
    title: {
      default: null,
      type:    String
    },
    tooltip: {
      default: null,
      type:    [String, Object]
    },
    weight: {
      default: 0,
      type:    Number
    },
  },

  provide() {
    const navigationNode = this.navigationNode;
    const openParents = this.openParents;

    return {
      addNavigation(navigation) {
        this.insertNavigationNode(navigation, navigationNode);
      },

      removeNavigation(navigation) {
        const index = navigationNode.children.indexOf(navigation);

        if (index >= 0) {
          navigationNode.children.splice(index, 1);
        }
      },

      openNavigation() {
        this.$set(navigationNode, 'showChildren', true);
        openParents();
      },
    };
  },

  data() {
    return {
      active:         null,
      navigationNode: {
        name:         this.name,
        label:        this.label,
        weight:       this.weight,
        children:     []
      },
    };
  },

  methods: {
    openParents() {
      this.openNavigation();
    }
  },

  computed: {
    labelDisplay() {
      if ( this.labelKey ) {
        return this.$store.getters['i18n/t'](this.labelKey);
      }

      if ( this.label ) {
        return this.label;
      }

      return this.name;
    },

    titleDisplay() {
      if ( this.title ) {
        return this.title;
      }

      return this.labelDisplay;
    },

    shouldShowHeader() {
      if ( this.showHeader !== null ) {
        return this.showHeader;
      }

      return false;
    }
  },

  watch: {
    label(neu) {
      this.navigationNode.label = neu;
    },
    active(neu) {
      if (neu) {
        this.$emit('active');
      }
    },
    weight(neu) {
      // if the weight of this tab changes, re-sort it in the navigation
      this.navigationNode.weight = neu;
      this.removeNavigation(this.navigationNode);
      this.addNavigation(this.navigationNode);
    }
  },

  mounted() {
    this.addTab(this);
    this.addNavigation(this.navigationNode);

    if (typeof this.showNavChildren !== 'undefined') {
      this.$set(this.navigationNode, 'showChildren', this.showNavChildren);
    }
  },

  beforeDestroy() {
    this.removeTab(this);
    this.removeNavigation(this.navigationNode);
  }
};
</script>

<template>
  <section
    :id="name"
    :aria-hidden="!active"
    role="tabpanel"
  >
    <div v-show="active" class="top-header">
      <h2 v-if="shouldShowHeader">
        {{ titleDisplay }}
        <i v-if="tooltip" v-tooltip="tooltip" class="icon icon-info icon-lg" />
      </h2>
      <slot name="beside-header" />
    </div>
    <div v-show="active">
      <slot v-show="active" v-bind="{active}" />
    </div>
    <slot name="nestedTabs" />
  </section>
</template>

<style lang="scss" scoped>
.top-header {
  align-items: flex-start;
  display: flex;
}

.top-header h2 {
  flex: 1 1 auto;
}

.top-header .btn.close {
  margin-left: 1em;
  margin-top: -2px;
  padding: 0;
}
</style>
