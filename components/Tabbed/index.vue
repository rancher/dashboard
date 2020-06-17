<script>
import { isEmpty } from 'lodash';

export default {
  name: 'Tabbed',

  props: {
    defaultTab: {
      type:    String,
      default: null,
    }
  },

  data() {
    return {
      tabs:            [],
      initialTabOrder: []
    };
  },

  computed: {
    filteredTabs() {
      // keep the tabs list ordered for dynamic tabs
      const tabs = this.tabs;
      const { initialTabOrder } = this;
      const out = [];

      if (isEmpty(initialTabOrder) && !isEmpty(tabs)) {
        tabs.forEach(tab => initialTabOrder.push(tab.name));
      }

      initialTabOrder.forEach((tabId) => {
        const match = tabs.find(t => t.name === tabId);

        if (match) {
          out.push(match);
        }
      });

      return out;
    }
  },

  watch: {
    filteredTabs(tabs) {
      const activeTab = tabs.find(t => t.active);
      const defaultTab = this.defaultTab;
      const windowsHash = window.location.hash.slice(1);
      const windowHashTabMatch = tabs.find(t => t.name === windowsHash && !t.active);
      const firstTab = tabs.length > 0 ? tabs[0] : null;

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

      if (activeTab.name === windowsHash) {
        this.select(activeTab.name);
      } else if (!isEmpty(windowHashTabMatch)) {
        this.select(windowHashTabMatch.name);
      } else {
        this.select(firstTab.name);
      }
    },
  },

  created() {
    this.tabs = this.$children;
  },

  mounted() {
    window.addEventListener('hashchange', this.hashChange);

    let tab;
    const selected = (window.location.hash || '').replace(/^#/, '');

    if ( selected ) {
      tab = this.find(selected);
    }

    if ( !tab ) {
      tab = this.find(this.defaultTab);
    }

    if ( !tab ) {
      tab = this.filteredTabs[0];
    }

    if ( tab ) {
      this.select(tab.name);
    }
  },

  unmounted() {
    window.removeEventListener('hashchange', this.hashChange);
  },

  methods: {
    hashChange() {
      this.select(window.location.hash);
    },

    find(name) {
      return this.filteredTabs.find(x => x.name === name );
    },

    select(name, event) {
      const selected = this.find(name);

      if ( !selected || selected.disabled) {
        return;
      }

      window.location.hash = `#${ name }`;

      for ( const tab of this.filteredTabs ) {
        tab.active = (tab.name === selected.name);
      }

      this.$emit('changed', { tab: selected });
    },

    selectNext(direction) {
      const currentIdx = this.filteredTabs.findIndex(x => x.active);

      const nextIdx = currentIdx + direction >= this.filteredTabs.length ? 0 : currentIdx + direction < 0 ? this.filteredTabs.length - 1 : currentIdx + direction;

      const nextName = this.filteredTabs[nextIdx].name;

      this.select(nextName);

      this.$nextTick(() => {
        this.$refs.tablist.focus();
      });
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
        v-for="tab in filteredTabs"
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
