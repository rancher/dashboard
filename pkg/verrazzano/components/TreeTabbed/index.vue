<script>
// Added by Verrazzano
import head from 'lodash/head';
import isEmpty from 'lodash/isEmpty';
import { addObject, removeObject, findBy } from 'shell/utils/array';
import NavigationHelper from '../../mixins/navigation-helper';
import SliderHelper from '../../mixins/slider-helper';
import NavigationNode from './NavigationNode';

export default {
  name: 'TreeTabbed',

  components: { NavigationNode },

  mixins: [NavigationHelper, SliderHelper],

  props: {
    defaultTab: {
      type:    String,
      default: null,
    },

    // whether or not to scroll to the top of the new tab on tab change. This is particularly ugly with side tabs
    scrollOnChange: {
      type:    Boolean,
      default: false
    },

    useHash: {
      type:    Boolean,
      default: true,
    },

    noContent: {
      type:    Boolean,
      default: false,
    },
  },

  provide() {
    const tabs = this.tabs;
    const navigationNode = this.navigationNode;
    const checkNewTab = this.checkNewTab;
    const selectTab = this.selectTab;

    return {
      addTab(tab) {
        const existing = findBy(tabs, 'name', tab.name);

        if ( existing ) {
          removeObject(tabs, existing);
        }

        addObject(tabs, tab);

        checkNewTab(tab);
      },

      removeTab(tab) {
        removeObject(tabs, tab);
      },

      addNavigation(navigation) {
        this.insertNavigationNode(navigation, navigationNode);
      },

      removeNavigation(navigation) {
        const index = navigationNode.children.indexOf(navigation);

        if (index >= 0) {
          navigationNode.children.splice(index, 1);
        }
      },

      openNavigation(navigation) {
        // called by top-level tabs, do nothing
      },

      selectTab,
    };
  },

  data() {
    return {
      tabs:            [],
      activeTabName:   null,
      selectWhenAdded: undefined,
      navigationNode:  {
        children:     [],
        showChildren: true
      },
    };
  },

  computed: {
    // keep the tabs list ordered for dynamic tabs
    sortedTabs() {
      // POC - not sure if these will need to be sorted for dynamic, but don't sort for static.
      // return sortBy(this.tabs, ['weight:desc', 'labelDisplay', 'name']);
      return this.tabs;
    },
  },

  watch: {
    sortedTabs(tabs) {
      const {
        defaultTab,
        useHash,
        $route: { hash }
      } = this;
      const activeTab = tabs.find(t => t.active);

      const windowHash = hash.slice(1);
      const windowHashTabMatch = tabs.find(t => t.name === windowHash && !t.active);
      const firstTab = head(tabs) || null;

      if (isEmpty(activeTab)) {
        if (useHash && !isEmpty(windowHashTabMatch)) {
          this.select(windowHashTabMatch.name);
        } else if (!isEmpty(defaultTab) && !isEmpty(tabs.find(t => t.name === defaultTab))) {
          this.select(defaultTab);
        } else if (firstTab?.name) {
          this.select(firstTab.name);
        }
      } else if (useHash && activeTab?.name === windowHash) {
        this.select(activeTab.name);
      }
    },
  },

  mounted() {
    if ( this.useHash ) {
      window.addEventListener('hashchange', this.hashChange);
    }

    this.slider = this.sliderHelper.create(
      this.$refs.slider,
      this.$refs.treeTabNav,
      this.$refs.treeTabContent,
      'treeTab',
      false
    );
  },

  unmounted() {
    if ( this.useHash ) {
      window.removeEventListener('hashchange', this.hashChange);
    }

    this.slider.destroy();
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
        $route: { hash: routeHash },
        $router: { currentRoute },
      } = this;

      const selected = this.find(name);
      const hashName = `#${ name }`;

      if ( !selected || selected.disabled) {
        return;
      }

      selected.openParents();

      if (this.useHash && routeHash !== hashName) {
        const kurrentRoute = { ...currentRoute };

        kurrentRoute.hash = hashName;

        this.$router.replace(kurrentRoute);
      }

      for ( const tab of sortedTabs ) {
        tab.active = (tab.name === selected.name);
      }

      this.$emit('changed', { tab: selected });
      this.activeTabName = selected.name;
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

    selectTab(tabName) {
      this.select(tabName);
      if (this.activeTabName !== tabName) {
        this.selectWhenAdded = tabName;
      }
    },

    checkNewTab(tab) {
      if (this.selectWhenAdded === tab.name) {
        this.select(tab.name);
        this.selectWhenAdded = undefined;
      }
    }
  },
};
</script>

<template>
  <div class="tree-tabbed">
    <div ref="treeTabNav" class="tab-nav">
      <NavigationNode
        :nav-node="navigationNode"
        :navigator="this"
        :active-tab-name="activeTabName"
      />
    </div>
    <div
      ref="slider"
      class="slider"
    >
    </div>
    <div
      ref="treeTabContent"
      :class="{ 'tab-container': !!tabs.length, 'no-content': noContent }"
    >
      <slot />
      <slot name="nestedTabs" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $nav-tabs-width: 260px;

  .tree-tabbed {
    display: flex;
    box-shadow: 0 0 20px var(--shadow);
    border-radius: calc(var(--border-radius) * 2);
    background-color: var(--tabbed-sidebar-bg);

    .tab-nav {
      width: $nav-tabs-width;
      min-width: 200px;
      max-width: 50%;
      overflow: auto;
      flex: 0 0 auto;
    }

    .tab-container {
      padding: 20px;
      flex-grow: 1;
      background-color: var(--body-bg);
      overflow: auto;

      &.no-content {
        padding: 0 0 3px 0;
      }
    }
  }

  .tree-tabbed .slider {
    width: 10px;
    margin: 0 -10px 0 0;
    cursor: ew-resize;
    user-select: none;
    z-index: 99;
  }
</style>
