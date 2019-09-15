
<script>
import { mapGetters } from 'vuex';
import { addObject, removeObject } from '@/utils/array';
import { explorerPackage, rioPackage } from '@/utils/packages';
import { mapPref, THEME, EXPANDED_GROUPS } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import NamespaceFilter from '@/components/NamespaceFilter';
import Group from '@/components/nav/Group';
import { COUNT } from '@/utils/types';

export default {
  components: {
    ActionMenu, NamespaceFilter, Group
  },

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    ...mapGetters(['preloaded']),

    counts() {
      const obj = this.$store.getters['cluster/all'](COUNT)[0].counts;
      const out = Object.keys(obj).map((id) => {
        const schema = this.$store.getters['cluster/schemaFor'](id);

        if ( !schema ) {
          return null;
        }

        const attrs = schema.attributes || {};
        const entry = obj[id];

        if ( !attrs.kind ) {
          // Skip apiGroups resource
          return;
        }

        return {
          id,
          schema,
          label:       attrs.kind,
          group:       attrs.group,
          version:     attrs.version,
          namespaced:  attrs.namespaced,
          verbs:       attrs.verbs,
          count:       entry.count,
          byNamespace: entry.namespaces,
          revision:    entry.revision,
        };
      });

      return out.filter(x => !!x);
    },

    packages() {
      const namespaces = this.$store.getters['namespaces'] || [];
      const counts = this.counts;

      const explorer = explorerPackage(this.$router, counts, namespaces);
      const rio = rioPackage(this.$router, counts, namespaces);

      const out = [
        rio,
        explorer,
      ];

      return out.filter(x => !!x);
    },

    expandedGroups: mapPref(EXPANDED_GROUPS),
  },

  methods: {
    toggleGroup(route, expanded) {
      const groups = this.expandedGroups.slice();

      if ( expanded ) {
        addObject(groups, route);
      } else {
        removeObject(groups, route);
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
  <div class="dashboard">
    <header>
      <div class="header-left">
        <n-link to="/">
          <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
        </n-link>
      </div>

      <div class="header-middle">
      </div>

      <div class="header-right text-right">
        <nuxt-link :to="{name: 'prefs'}">
          <i class="icon icon-3x icon-gear" />
        </nuxt-link>
      </div>
    </header>

    <nav v-if="preloaded">
      <NamespaceFilter class="mt-20 mb-0" />

      <div v-for="pkg in packages" :key="pkg.name" class="package">
        <Group
          :key="pkg.name"
          :id-prefix="pkg.name"
          :is-expanded="isExpanded"
          :group="pkg"
          :toggle-group="toggleGroup"
          :custom-header="true"
          :can-collapse="pkg.name !== 'rio'"
        >
          <template slot="accordion">
            <h6>{{ pkg.label }}</h6>
          </template>
        </Group>
      </div>
    </nav>

    <main>
      <nuxt />
    </main>

    <ActionMenu />
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 60px;
  $nav-width: 250px;
  $right-width: 100px;
  $logo-height: 40px;

  .dashboard {
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

  .collection  {
    &::v-deep > .body {
      margin-left: 10px;
      border-left: solid thin var(--border);
    }
  }

  NAV {
    grid-area: nav;
    position: relative;
    background-color: var(--nav-bg);
    padding: 0 10px;
    overflow-y: auto;

    .package:not(:first-child) {
      margin-top: 20px;
    }

    H6 {
      margin: 0;
      letter-spacing: 0.1em;
      line-height: initial;
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
    overflow: auto;
  }
</style>

<style lang="scss">
  MAIN HEADER {
    display: grid;
    grid-template-areas: "title actions";
    grid-template-columns: "auto min-content";
    margin-bottom: 20px;

    H1 {
      grid-area: title;
      margin: 0;
      padding-top: 4px;
    }

    .actions {
      grid-area: actions;
      text-align: right;
      padding-top: 10px;
    }
  }
</style>
