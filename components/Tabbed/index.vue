<script>
export default {
  name: 'Tabbed',

  props: {
    defaultTab: {
      type:    String,
      default: null,
    }
  },

  data() {
    return { tabs: null };
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
      tab = this.tabs[0];
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
      return this.tabs.find(x => x.name === name );
    },

    select(name, event) {
      const selected = this.find(name);

      if ( !selected || selected.disabled) {
        return;
      }

      window.location.hash = `#${ name }`;

      for ( const tab of this.tabs ) {
        tab.active = (tab.name === selected.name);
      }

      this.$emit('changed', { tab: selected });
    },
  },
};
</script>

<template>
  <div>
    <ul role="tablist" class="tabs clearfix">
      <li
        v-for="tab in tabs"
        :key="tab.name"
        :class="{tab: true, active: tab.active, disabled: tab.disabled}"
        role="presentation"
      >
        <a
          :href="'#' + tab.name"
          :aria-controls="'#' + tab.name"
          :aria-selected="tab.active"
          role="tab"
          @click.prevent="select(tab.name, $event)"
        >
          {{ tab.label }}
        </a>
      </li>
    </ul>
    <div class="container">
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
      border: 1px solid var(--tabbed-border);
      margin-right: 1px;

      A {
        display: block;
        padding: 10px;
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

  .container {
    padding: 10px;
    border: 1px solid var(--tabbed-border);
    background-color: var(--tabbed-container-bg);
  }
</style>
