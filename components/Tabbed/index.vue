<script>
import { isEmpty, head, sortBy } from 'lodash';

export default {
  name: 'Tabbed',

  props: {
    defaultTab: {
      type:    String,
      default: null,
    }
  },

  data() {
    return { tabs: [] };
  },

  computed: {
    sortedTabs() {
      // keep the tabs list ordered for dynamic tabs
      const { tabs } = this;

      return sortBy(tabs, ['weight', 'label', 'name']);
    }
  },

  watch: {
    '$route.hash'() {
      this.hashChange();
    },

    sortedTabs(tabs) {
      const {
        defaultTab,
        $route: { hash }
      } = this;
      const activeTab = tabs.find(t => t.active);
      const windowHash = hash.slice(1);
      const windowHashTabMatch = tabs.find(t => t.name === windowHash && !t.active);
      const firstTab = head(tabs) || null;

      if (isEmpty(activeTab)) {
        if (defaultTab && !isEmpty(tabs.find(t => t.name === defaultTab))) {
          this.select(defaultTab);
        } else {
          if (!isEmpty(windowHashTabMatch)) {
            this.select(windowHashTabMatch.name);

            return;
          }

          if (firstTab) {
            this.select(firstTab.name);

            return;
          }
        }
      }

      if (activeTab.name === windowHash) {
        this.select(activeTab.name);
      } else if (!isEmpty(windowHashTabMatch)) {
        this.select(windowHashTabMatch.name);
      } else {
        this.select(firstTab.name);
      }
    },
  },

  created() {
    const {
      $children,
      $route: { hash },
      defaultTab,
      sortedTabs,
    } = this;

    this.tabs = $children;

    let tab;
    const selected = (hash || '').replace(/^#/, '');

    if ( selected ) {
      tab = this.find(selected);
    }

    if ( !tab ) {
      tab = this.find(defaultTab);
    }

    if ( !tab ) {
      tab = head(sortedTabs);
    }

    if ( tab ) {
      this.select(tab.name);
    }
  },

  mounted() {
    window.addEventListener('hashchange', this.hashChange);
  },

  unmounted() {
    window.removeEventListener('hashchange', this.hashChange);
  },

  methods: {
    hashChange() {
      this.select(this.$route.hash);
    },

    find(name) {
      return this.sortedTabs.find(x => x.name === name );
    },

    select(name/* , event */) {
      const {
        sortedTabs,
        $route: { hash: routeHash },
      } = this;

      const selected = this.find(name);
      const hashName = `#${ name }`;

      if ( !selected || selected.disabled) {
        return;
      }

      if (routeHash !== hashName) {
        window.location.hash = `#${ name }`;
      }

      for ( const tab of sortedTabs ) {
        tab.active = (tab.name === selected.name);
      }

      this.$emit('changed', { tab: selected });
    },

    selectNext(direction) {
      const { sortedTabs } = this;
      const currentIdx = sortedTabs.findIndex(x => x.active);
      const nextIdx = getCyclicalIdx(currentIdx, direction, sortedTabs.length);
      const nextName = sortedTabs[nextIdx].name;

      this.select(nextName);

      this.$nextTick(() => {
        this.$refs.tablist.focus();
      });

      function getCyclicalIdx(currentIdx, direction, tabsLength) {
        const nxt = currentIdx + direction;

        if (nxt >= tabsLength) {
          return 0;
        } else if (nxt <= 0) {
          return tabsLength - 1;
        } else {
          return nxt;
        }
      }
    }
  },
};
</script>

<template>
  <div>
    <ul
      ref="tablist"
      role="tablist"
      class="tabs clearfix"
      tabindex="0"
      @keyup.39.stop="selectNext(1)"
      @keyup.37.stop="selectNext(-1)"
    >
      <li
        v-for="tab in sortedTabs"
        :id="tab.name"
        :key="tab.name"
        :class="{tab: true, active: tab.active, disabled: tab.disabled}"
        role="presentation"
      >
        <a
          :aria-controls="'#' + tab.name"
          :aria-selected="tab.active"
          role="tab"
          @click.prevent="select(tab.name, $event)"
        >
          {{ tab.label }}
        </a>
      </li>
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

    &:focus {
     outline:none;

      & .tab.active {
          outline-color: var(--outline);
          outline-style: solid;
          outline-width: var(--outline-width);
      }
    }

    .tab {
      position: relative;
      top: 1px;
      float: left;
      border-radius: 3px 3px 0 0;
      margin: 0 8px 0 0;
      cursor: pointer;

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

  .contrast{
    & .tab-container {
      background-color: var(--tabbed-container-bg-contrast);
    }

    & .tab.active{
      background-color: var(--tabbed-container-bg-contrast);
        border-bottom-color: var(--tabbed-container-bg-contrast);
    }
  }
</style>
