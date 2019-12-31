
<script>
import { mapState } from 'vuex';
import { addObject, removeObject } from '@/utils/array';
import { explorerPackage, /* clusterPackage, */ rioPackage } from '@/config/packages';
import { mapPref, DEV, THEME, EXPANDED_GROUPS } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import NamespaceFilter from '@/components/nav/NamespaceFilter';
// import ClusterSwitcher from '@/components/nav/ClusterSwitcher';
import ShellSocket from '@/components/ContainerExec/ShellSocket';
import PromptRemove from '@/components/PromptRemove';
import Group from '@/components/nav/Group';
import Footer from '@/components/nav/Footer';
import { COUNT, RANCHER } from '@/config/types';

export default {

  components: {
    // ClusterSwitcher,
    PromptRemove,
    Footer,
    NamespaceFilter,
    ActionMenu,
    Group,
    ShellSocket,
  },

  middleware: ['authenticated'],

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden` },
      title:     'Rio Dashboard',
    };
  },

  computed: {
    ...mapState(['preloaded']),
    dev:            mapPref(DEV),
    expandedGroups: mapPref(EXPANDED_GROUPS),

    principal() {
      return this.$store.getters['rancher/byId'](RANCHER.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    counts() {
      if ( !this.$store.getters['cluster/haveAll'](COUNT) ) {
        return null;
      }

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

      if ( !counts ) {
        return [];
      }

      const out = [
        rioPackage(this.$router, counts, namespaces),
        // clusterPackage(this.$router, counts, namespaces),
        explorerPackage(this.$router, counts, namespaces),
      ];

      return out.filter(x => !!x);
    },
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
    },

    toggleLocale() {
      this.$store.dispatch('i18n/toggleNone');
    }
  }
};
</script>

<template>
  <div v-if="preloaded" class="dashboard-root">
    <div class="switcher">
      <img src="~/assets/images/logo.svg" class="logo" alt="Logo" height="30" />
    </div>

    <div class="top">
      <NamespaceFilter />
    </div>

    <div class="user">
      <v-popover
        placement="bottom"
        offset="-10"
        trigger="hover"
        :delay="{show: 0, hide: 200}"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <div class="header-right text-right">
          <img :src="principal.avatarSrc" width="40" height="40" />
        </div>

        <template slot="popover">
          <ul class="list-unstyled dropdown" style="margin: -1px;">
            <li>
              <div>{{ principal.loginName }}</div>
              <div><span class="text-muted">{{ principal.name }}</span></div>
            </li>
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="pt-10 pb-10 hand">
              <a>Preferences <i class="icon icon-fw icon-gear" /></a>
            </nuxt-link>
            <nuxt-link tag="li" :to="{name: 'auth-logout'}" class="pt-10 pb-10 hand">
              <a>Log Out <i class="icon icon-fw icon-close" /></a>
            </nuxt-link>
          </ul>
        </template>
      </v-popover>
    </div>

    <nav>
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

    <main>
      <nuxt class="outlet" />
      <Footer />
    </main>
    <ShellSocket />
    <ActionMenu />
    <PromptRemove />
    <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleLocale()" />
  </div>
</template>

<style lang="scss">
  $header-height: 50px;

  .dashboard-root {
    display: grid;
    height: 100vh;
    grid-template-areas:
      "switcher top user"
      "nav      main  main";
    grid-template-columns: 220px auto $header-height;
    grid-template-rows: $header-height auto 0px;

    .switcher {
      grid-area: switcher;
      background-color: var(--header-bg);
      position: relative;
    }

    .logo {
      position: absolute;
      left: -30px;
      top: 10px;
    }

    .top {
      grid-area: top;
      background-color: var(--header-bg);
      padding-top: 6px;
    }

    .user {
      grid-area: user;
      padding: 5px;
    }

    .switcher, .header, .user {
      background-color: var(--header-bg);
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
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      padding: 20px 20px 70px 20px;
      min-height: 100%;
      margin-bottom: -51px;
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: 50px;
    }

    HEADER {
      display: grid;
      grid-template-areas: "title actions";
      grid-template-columns: "auto min-content";
      margin-bottom: 20px;

      H1 {
        grid-area: title;
        margin: 0;
        padding-top: 4px;

        .nuxt-link-active {
          padding-right: 10px;
        }
      }

      .actions {
        grid-area: actions;
        text-align: right;
        padding-top: 10px;
      }
    }

  }
</style>
