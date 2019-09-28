
<script>
import { mapGetters } from 'vuex';
import { addObject, removeObject } from '@/utils/array';
import { explorerPackage, rioPackage } from '@/config/packages';
import { mapPref, THEME, EXPANDED_GROUPS } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import NamespaceFilter from '@/components/nav/NamespaceFilter';
import ClusterSwitcher from '@/components/nav/ClusterSwitcher';
import Group from '@/components/nav/Group';
import { COUNT } from '@/config/types';

export default {
  components: {
    ClusterSwitcher,
    NamespaceFilter,
    ActionMenu,
    Group
  },

  middleware: ['authenticated'],

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },

  computed: {
    ...mapGetters({ principal: 'auth/principal' }),

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

  mounted() {
    if ( this.$store.state.auth.loggedIn ) {
      const url = `${ window.location.origin.replace(/^http(s)?:/, 'ws$1:') }/v1/subscribe`;

      this.$connect(url);
    }
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
  <div class="dashboard-root">
    <div class="top">
      <div class="header-left">
        <ClusterSwitcher />
      </div>

      <div class="header-middle">
      </div>

      <v-popover
        placement="bottom"
        offset="-10"
        trigger="hover"
        :delay="{show: 0, hide: 200}"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <div class="header-right text-right">
          <img :src="principal.profilePicture" width="40" height="40" />
        </div>

        <template slot="popover">
          <ul class="list-unstyled text-right dropdown" style="margin: -14px;">
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="p-10">
              <a>Preferences <i class="icon icon-fw icon-gear" /></a>
            </nuxt-link>
            <nuxt-link tag="li" :to="{name: 'auth-logout'}" class="p-10">
              <a>Log Out <i class="icon icon-fw icon-close" /></a>
            </nuxt-link>
          </ul>
        </template>
      </v-popover>
    </div>

    <nav>
      <NamespaceFilter class="mt-20 mb-0" />

      <div v-for="pkg in packages" :key="pkg.name" class="package">
        <Group
          :key="pkg.name"
          id-prefix=""
          :is-expanded="isExpanded"
          :group="pkg"
          :toggle-group="toggleGroup"
          :custom-header="true"
          :can-collapse="true"
        >
          <template slot="accordion">
            <h6>{{ pkg.label }}</h6>
          </template>
        </Group>
      </div>
    </nav>

    <div class="logo">
      <n-link to="/">
        <img src="~/assets/images/logo.svg" alt="logo" width="100%" />
      </n-link>
    </div>

    <main>
      <nuxt />
    </main>

    <ActionMenu />
  </div>
</template>

<style lang="scss">
  $header-height: 60px;
  $nav-width: 250px;
  $right-width: 60px;
  $logo-height: 50px;

  .dashboard-root {
    display: grid;
    height: 100vh;
    grid-template-areas:
      "header header"
      "nav main"
      "logo main";
    grid-template-columns: $nav-width auto;
    grid-template-rows: $header-height auto $logo-height;

    .top {
      background-color: var(--header-bg);
      grid-area: header;
      display: grid;
      grid-template-areas: "header-left header-middle header-right";
      grid-template-columns: $nav-width auto $right-width;

      .header-left {
        grid-area: header-left;
        position: relative;
      }

      .header-middle {
        padding: 10px 0;
        grid-area: header-middle;
      }

      .header-right {
        grid-area: header-right;
        padding: 10px;
        cursor: pointer;
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
      background-color: var(--nav-bg);
      padding: 10px;
    }
  }

  MAIN {
    grid-area: main;
    padding: 20px;
    overflow: auto;

    HEADER {
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
  }
</style>
