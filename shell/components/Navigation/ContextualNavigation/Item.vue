<script>
import DropdownChevron from './DropdownChevron';

export default {
  name: 'ContextualNavigationItem',

  components: { DropdownChevron },

  props: {
    location: {
      type:    Object,
      default: null
    },
    label: {
      type:    String,
      default: null
    },

    labelKey: {
      type:    String,
      default: null
    },

    children: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { open: false };
  },

  methods: {
    toggle() {
      this.$set(this, 'open', !this.open);
    }
  },

  computed: {
    labelDisplay() {
      if (this.label) {
        return this.label;
      }

      return this.labelKey ? this.t(this.labelKey) : '<no-label>';
    }
  }
};
</script>

<template>
  <div class="item">
    <div
      :is="location ? 'n-link' : 'div'"
      :to="location"
      class="header"
    >
      <h6>{{ labelDisplay }}</h6>
      <DropdownChevron
        v-if="children.length > 0"
        class="arrow"
        :open="open"
        @click="toggle"
      />
    </div>
    <div
      v-if="children.length > 0 && open"
      class="body"
    >
      <ContextualNavigationItem
        v-for="child in children"
        :key="child.label"
        :location="child.location"
        :label="child.label"
        :children="child.children || {}"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .contextual-navigation {
    height: 100%;
    width: var(--nav-width);

    background-color: var(--nav-bg);
    border-right: var(--nav-border-size) solid var(--nav-border);
    overflow-y: auto;

    .header {
        position: relative;
        display: flex;

        justify-content: space-between;
        padding: 8px 0;
        color: var(--body-text);

        cursor: pointer;
        height: 33px;

        &:hover:not(.active) {
            background-color: var(--nav-hover);
        }

        h6 {
            line-height: 15px;
            padding-left: 16px;
            text-transform: none;
            font-size: 14px;
        }

        .arrow {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            width: 31px;

            padding-top: 10px;
            margin-right: -7px;
        }
    }
  }
</style>
