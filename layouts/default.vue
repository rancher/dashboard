
<script>
import { addObject, removeObject } from '../utils/array';
import Accordion from '~/components/Accordion';
import NamespacePicker from '~/components/NamespacePicker';
import { mapPref, THEME, EXPANDED_GROUPS } from '~/store/prefs';
import { groupsForCounts } from '~/utils/groups';

export default {
  components: { Accordion, NamespacePicker },

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    theme: mapPref(THEME),

    packages() {
      const namespaces = this.$store.getters['namespaces'] || [];
      const { clusterLevel, namespaceLevel } = groupsForCounts(this.$store.getters['v1/counts'], namespaces);

      const out = [
        {
          name:   'namespaced',
          label:  'Namespaced',
          route:  '/ns',
          groups: namespaceLevel
        },
        {
          name:   'cluster',
          label:  'Global',
          route:  '/cluster',
          groups: clusterLevel
        },
      ];

      return out;
    },

    expandedGroups() {
      return this.$store.getters['prefs/get'](EXPANDED_GROUPS);
    }
  },

  methods: {
    toggleGroup(id, expanded) {
      const groups = this.expandedGroups.slice();

      if ( expanded ) {
        addObject(groups, id);
      } else {
        removeObject(groups, id);
      }

      this.$store.commit('prefs/set', { key: EXPANDED_GROUPS, val: groups });
    },

    isExpanded(name) {
      return this.expandedGroups.includes(name);
    }
  }
};
</script>

<template>
  <div class="root">
    <header>
      <div class="header-left">
        <n-link to="/">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </n-link>
      </div>

      <div class="header-middle">
      </div>

      <div class="header-right text-right">
        <div v-trim-whitespace class="btn-group theme-picker">
          <button type="button" :class="{'light': true, 'btn': true, 'btn-sm': true, 'bg-default': true, 'active': theme === 'light'}" @click="theme='light'">
            <i class="icon icon-dot" />
          </button>
          <button type="button" :class="{'dark': true, 'btn': true, 'btn-sm': true, 'bg-default': true, 'active': theme === 'dark'}" @click="theme='dark'">
            <i class="icon icon-dot" />
          </button>
        </div>
        <!--
        <nuxt-link :to="{name: 'prefs'}">
          <i class="icon icon-2x icon-gear" />
        </nuxt-link>
        -->
      </div>
    </header>

    <nav>
      <div v-for="pkg in packages" :key="pkg.name" class="package">
        <h6>
          {{ pkg.label }}
          <NamespacePicker v-if="pkg.name === 'namespaced'" />
        </h6>
        <hr />
        <Accordion
          v-for="group in pkg.groups"
          :id="group.id"
          :key="group.name"
          :label="group.label"
          :expanded="isExpanded(group.id)"
          class="groups"
          @on-toggle="toggleGroup"
        >
          <template>
            <ul v-if="group.children" class="list-unstyled children">
              <n-link v-for="child in group.children" :key="child.route" :to="child.route" tag="li" class="child">
                <a>
                  <span class="label">{{ child.label }}</span>
                  <span class="count">{{ child.count }}</span>
                </a>
              </n-link>
            </ul>
          </template>
        </Accordion>
      </div>
    </nav>

    <main>
      <nuxt />
    </main>
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 60px;
  $nav-width: 250px;
  $right-width: 100px;
  $logo-height: 40px;

  .root {
    display: grid;
    height: 100vh;
    grid-template-areas:
      "header header"
      "nav main";
    grid-template-columns: $nav-width auto;
    grid-template-rows: $header-height auto;
  }

  .theme-picker {
    position: relative;
    top: 2px;

    .light {
      color: white !important;
    }

    .dark {
      color: black !important;
    }
  }

  HEADER {
    background-color: var(--header-bg);
    grid-area: header;
    display: grid;
    grid-template-areas: "header-left header-middle header-right";
    grid-template-columns: $nav-width auto $right-width;
  }

  .header-left {
    padding: 20px 10px 0;
    grid-area: header-left;
  }

  .header-middle {
    padding: 10px 0;
    grid-area: header-middle;
  }

  .header-right {
    padding: 10px;
    grid-area: header-right;
  }

  NAV {
    grid-area: nav;
    position: relative;
    background-color: var(--nav-bg);
    padding: 0 10px;
    overflow-y: auto;

    ul {
      border-left: solid thin var(--border);
      margin-left: 10px;

      .child {
        display: grid;
        grid-template-areas: "label count";
        grid-template-columns: auto 40px;
        width: 100%;

        $top: 10px;
        $bottom: $top - 2px;

        A {
          font-size: 14px;
          margin: 0 10px;
          padding: 10px;
          grid-area: label;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .count {
          grid-area: count;
          font-size: 12px;
          text-align: right;
          padding: 11px 10px 0 0;
          justify-items: center;
        }

        &.nuxt-link-exact-active {
          background-color: var(--nav-active);
        }
      }
    }
  }

  .logo {
    grid-area: logo;
    text-align: center;
    border-top: solid thin var(--border);
    padding: 20px;
  }

  MAIN {
    grid-area: main;
    padding: 20px;
  }
</style>
