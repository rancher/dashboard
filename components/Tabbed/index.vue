<script>
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import { addObject, removeObject, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import findIndex from 'lodash/findIndex';

export default {
  name: 'Tabbed',

  props: {
    defaultTab: {
      type:    String,
      default: null,
    },

    sideTabs: {
      type:    Boolean,
      default: false
    },

    showTabsAddRemove: {
      type:    Boolean,
      default: false
    },

    // tabs with canToggle will be hidden by default and revealed by clicking this link
    showMoreLabel: {
      type:    String,
      default: 'Show Extra'
    },

    hideMoreLabel: {
      type:    String,
      default: 'Hide Extra'
    },

    hideAllowed: {
      type:    Boolean,
      default: false
    },

    // whether or not to scroll to the top of the new tab on tab change. This is particularly ugly with side tabs
    scrollOnChange: {
      type:    Boolean,
      default: false
    },

    tabsUseHistoryReplace: {
      type:    Boolean,
      default: true,
    }
  },

  provide() {
    const tabs = this.tabs;

    return {
      addTab(tab) {
        const existing = findBy(tabs, 'name', tab.name);

        if ( existing ) {
          removeObject(tabs, existing);
        }

        addObject(tabs, tab);
      },

      removeTab(tab) {
        removeObject(tabs, tab);
      }
    };
  },

  data() {
    return { tabs: [], showHiddenTabs: false };
  },

  computed: {
    // keep the tabs list ordered for dynamic tabs
    sortedShownTabs() {
      const { tabs } = this;
      const shownTabs = tabs.filter(tab => !tab.canToggle);

      return sortBy(shownTabs, ['weight:desc', 'label', 'name']);
    },

    sortedHiddenTabs() {
      const { tabs } = this;
      const hiddenTabs = tabs.filter(tab => tab.canToggle);

      return sortBy(hiddenTabs, ['weight:desc', 'label', 'name']);
    },

    sortedTabs() {
      return [...this.sortedShownTabs, ...this.sortedHiddenTabs];
    },

    showTabToggle() {
      return this.sortedHiddenTabs.length && (this.hideAllowed || !this.showHiddenTabs);
    }
  },

  watch: {
    sortedTabs(tabs) {
      const {
        defaultTab,
        $route: { hash }
      } = this;
      const activeTab = tabs.find(t => t.active);

      if (activeTab && activeTab.canToggle) {
        this.showHiddenTabs = true;
      }

      const windowHash = hash.slice(1);
      const windowHashTabMatch = tabs.find(t => t.name === windowHash && !t.active);
      const firstTab = head(tabs) || null;

      if (isEmpty(activeTab)) {
        if (!isEmpty(windowHashTabMatch)) {
          this.select(windowHashTabMatch.name);
        } else if (!isEmpty(defaultTab) && !isEmpty(tabs.find(t => t.name === defaultTab))) {
          this.select(defaultTab);
        } else if (firstTab?.name) {
          this.select(firstTab.name);
        }
      } else if (activeTab?.name === windowHash) {
        this.select(activeTab.name);
      }
    },
  },

  mounted() {
    window.addEventListener('hashchange', this.hashChange);

    this.$nextTick(() => {
      const {
        $route: { hash },
        defaultTab,
        sortedTabs,
      } = this;

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
    });
  },

  unmounted() {
    window.removeEventListener('hashchange', this.hashChange);
  },

  methods: {
    hashChange() {
      if (!this.scrollOnChange) {
        const scrollable = document.getElementsByTagName('main')[0];

        if (scrollable) {
          scrollable.scrollTop = 0;
        }
      }
      this.select(this.$route.hash);
    },

    find(name) {
      return this.sortedTabs.find(x => x.name === name );
    },

    select(name/* , event */) {
      const {
        sortedTabs,
        tabsUseHistoryReplace,
        $route: { hash: routeHash },
        $router: { currentRoute },
      } = this;

      const selected = this.find(name);
      const hashName = `#${ name }`;

      if ( !selected || selected.disabled) {
        return;
      }

      if (selected.canToggle) {
        this.showHiddenTabs = true;
      }

      if (routeHash !== hashName) {
        const kurrentRoute = { ...currentRoute };

        kurrentRoute.hash = hashName;

        if (tabsUseHistoryReplace) {
          this.$router.replace(kurrentRoute);
        } else {
          this.$router.push(kurrentRoute);
        }
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
    },
    tabAddClicked() {
      this.$emit('addTab');
    },
    tabRemoveClicked() {
      const activeTabIndex = findIndex(this.tabs, tab => tab.active);

      this.$emit('removeTab', activeTabIndex);
    },
  },
};
</script>

<template>
  <div :class="{'side-tabs':!!sideTabs}">
    <ul
      ref="tablist"
      role="tablist"
      class="tabs"
      :class="{'clearfix':!sideTabs}"
      tabindex="0"
      @keydown.right.prevent="selectNext(1)"
      @keydown.left.prevent="selectNext(-1)"
    >
      <li
        v-for="tab in sortedShownTabs"
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
      <li v-if="showTabToggle" class="tab toggle">
        <a @click.prevent="showHiddenTabs = !showHiddenTabs">
          <i class="icon icon-sm" :class="{'icon-plus': !showHiddenTabs, 'icon-minus':showHiddenTabs}" />
          {{ showHiddenTabs ? hideMoreLabel : showMoreLabel }}
        </a>
      </li>
      <template v-if="showHiddenTabs">
        <li
          v-for="tab in sortedHiddenTabs"
          :id="tab.name"
          :key="tab.name"
          class="can-toggle"
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
      </template>
      <ul v-if="sideTabs && showTabsAddRemove" class="tab-list-footer">
        <li>
          <button type="button" class="btn bg-transparent" @click="tabAddClicked">
            <i class="icon icon-plus" />
          </button>
          <button type="button" class="btn bg-transparent" @click="tabRemoveClicked">
            <i class="icon icon-minus" />
          </button>
        </li>
      </ul>
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
        // box-shadow: 0 0 20px var(--shadow);
        // clip-path: polygon(-100% -100%, 100% -100%, 200% 100%, -100% 100%);

        A {
          color: var(--body-text);
          text-decoration: none;
        }
      }
    }
  }

  .tab-container {
    padding: 20px;
    background-color: var(--tabbed-container-bg);
    // box-shadow: 0 0 20px var(--shadow);
  }

  .side-tabs{
    display: flex;
    box-shadow: 0 0 20px var(--shadow);
    border-radius: calc(var(--border-radius) * 2);
    background-color: var(--tabbed-sidebar-bg);

    .tab-container {
      padding: 20px;
    }

    & .tabs {
      width: $sideways-tabs-width;
      min-width: $sideways-tabs-width;
      display: flex;
      flex: 1 0;
      flex-direction: column;

      & .tab {
        width: 100%;
        border-left: solid 5px transparent;

        &.toggle A {
          color: var(--primary);
        }

        A {
          color: var(--primary);
        }

        &.active {
          background-color: var(--body-bg);
          border-left: solid 5px var(--primary);

          & A{
            color: var(--input-label);
          }
        }
      }
      .tab-list-footer {
        list-style: none;
        padding: 0;
        margin-top: auto;

        li {
          display: flex;
          flex: 1;

          .btn {
            flex: 1 1;
          }

          button:first-of-type {
            border-top: solid thin var(--border);
            border-right: solid thin var(--border);
            border-top-right-radius: 0;
          }
          button:last-of-type {
            border-top: solid thin var(--border);
            border-top-left-radius: 0;
          }

        }
      }
    }

    & .tab-container{
      width: calc(100% - #{$sideways-tabs-width});
      flex-grow: 1;
      background-color: var(--body-bg);
    }
  }
</style>
