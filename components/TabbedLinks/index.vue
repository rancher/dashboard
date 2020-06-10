<script>
export default {
  name: 'TabbedLinks',

  props: {
    /**
     * Default tab to display from the list
     */
    defaultTab: {
      type:     String,
      default:  null,
      required: false,
    },
    /**
     * The list of tabs to display
     * @model
     */
    tabList: {
      type:     Array,
      required: true,
      default:  () => [],
    }
  },

  data() {
    const { tabList } = this;

    return { tabs: tabList };
  },
};
</script>

<template>
  <div>
    <ul
      v-if="tabs !== null && tabs.length > 0"
      role="tablist"
      class="tabs clearfix"
    >
      <n-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.route"
        tag="li"
        role="presentation"
        class="tab"
        exact-active-class="active"
        exact
      >
        <a>
          {{ tab.label }}
        </a>
      </n-link>
    </ul>
    <div class="tab-container">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .tabs {
    list-style-type: none;
    margin: 0;
    padding: 0;

    .tab {
      position: relative;
      top: 1px;
      float: left;
      border-radius: 3px 3px 0 0;
      margin: 0 8px 0 0;

      A {
        display: block;
        padding: 10px 15px;
      }

      &:last-child {
        margin-right: 0;
      }

      &.active {
        background-color: var(--tabbed-container-bg);
        border-bottom-color: var(--tabbed-container-bg);
      }
    }
  }

  .tab-container {
    padding: 20px;
    background-color: var(--tabbed-container-bg);
  }
</style>
