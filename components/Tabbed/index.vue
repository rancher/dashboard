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

    selectNext(direction) {
      const currentIdx = this.tabs.findIndex(x => x.active);

      const nextIdx = currentIdx + direction >= this.tabs.length ? 0 : currentIdx + direction < 0 ? this.tabs.length - 1 : currentIdx + direction;

      const nextName = this.tabs[nextIdx].name;

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
    <div class="spacer"></div>
    <ul
      ref="tablist"
      role="tablist"
      class="tabs clearfix"
      tabindex="0"
      @keyup.39.stop="selectNext(1)"
      @keyup.37.stop="selectNext(-1)"
    >
      <li
        v-for="tab in tabs"
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
    padding: 40px;
    /* border: 1px solid var(--tabbed-border); */
    background-color: var(--tabbed-container-bg);
  }
</style>
