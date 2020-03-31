<script>
import { debounce } from 'lodash';
import { mapState } from 'vuex';
import { addObjects } from '../utils/array';
import {
  mapPref, DEV, THEME, EXPANDED_GROUPS, RECENT_TYPES, FAVORITE_TYPES
} from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import Jump from '@/components/nav/Jump';
import NamespaceFilter from '@/components/nav/NamespaceFilter';
import ClusterSwitcher from '@/components/nav/ClusterSwitcher';
// import WindowManager from '@/components/nav/WindowManager';
import ShellSocket from '@/components/ContainerExec/ShellSocket';
import PromptRemove from '@/components/PromptRemove';
import Group from '@/components/nav/Group';
import Footer from '@/components/nav/Footer';
import { COUNT, NORMAN, SCHEMA } from '@/config/types';
import { BASIC, FAVORITE, USED } from '@/store/type-map';

export default {

  components: {
    ClusterSwitcher,
    Jump,
    PromptRemove,
    Footer,
    NamespaceFilter,
    ActionMenu,
    Group,
    ShellSocket,
    // WindowManager
  },

  data() {
    return { groups: [] };
  },

  middleware: ['authenticated'],

  computed: {
    ...mapState(['managementReady', 'clusterReady', 'isRancher', 'currentCluster']),

    namespaces() {
      return this.$store.getters['namespaces']();
    },

    dev:            mapPref(DEV),
    expandedGroups: mapPref(EXPANDED_GROUPS),
    recentTypes:    mapPref(RECENT_TYPES),
    favoriteTypes:  mapPref(FAVORITE_TYPES),

    backToRancherLink() {
      if ( !this.isRancher ) {
        return;
      }

      const cluster = this.$store.getters['currentCluster'];

      if ( !cluster ) {
        return;
      }

      let link = `/c/${ escape(cluster.id) }`;

      if ( process.env.dev ) {
        link = `https://localhost:8000${ link }`;
      }

      return link;
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    allSchemas() {
      return this.$store.getters['cluster/all'](SCHEMA);
    },

    counts() {
      // So that there's something to watch for updates
      if ( this.$store.getters['cluster/haveAll'](COUNT) ) {
        const counts = this.$store.getters['cluster/all'](COUNT)[0].counts;

        return counts;
      }

      return {};
    },
  },

  watch: {
    counts() {
      this.queueUpdate();
    },

    allSchemas() {
      this.queueUpdate();
    },

    favoriteTypes() {
      this.queueUpdate();
    },

    namespaces() {
      // Immediately update because you'll see it come in later
      this.getGroups();
    },

    recentTypes() {
      // Immediately update because you'll see it come in later
      this.getGroups();
    },

    clusterReady() {
      // Immediately update because you'll see it come in later
      this.getGroups();
    }
  },

  created() {
    this.queueUpdate = debounce(this.getGroups, 500);
    this.getGroups();
  },

  methods: {
    getGroups() {
      if ( !this.clusterReady ) {
        this.groups = [];

        return;
      }

      const clusterId = this.$store.getters['clusterId'];
      const currentType = this.$route.params.resource || '';
      let namespaces = null;

      if ( !this.$store.getters['isAllNamespaces'] ) {
        namespaces = Object.keys(this.namespaces);
      }

      const namespaceMode = this.$store.getters['namespaceMode'];
      const out = [];

      for ( const mode of [BASIC, FAVORITE, USED] ) {
        const types = this.$store.getters['type-map/allTypes'](mode) || {};
        const more = this.$store.getters['type-map/getTree'](mode, types, clusterId, namespaceMode, namespaces, currentType);

        addObjects(out, more);
      }

      this.groups = out;
    },

    isExpanded(name) {
      const currentType = this.$route.params.resource || '';

      return this.expandedGroups.includes(name) || name === currentType;
    },

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },

    wheresMyDebugger() {
      // vue-shortkey is preventing F8 from passing through to the browser... this works for now.
      // eslint-disable-next-line no-debugger
      debugger;
    }
  },

  head() {
    let theme = this.$store.getters['prefs/get'](THEME);

    // Rancher
    if ( theme.startsWith('ui-') ) {
      theme = theme.substr(3);
    }

    // @TODO auto support
    if ( theme === 'auto' ) {
      theme = 'dark';
    }

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     'Dashboard',
    };
  },

};
</script>

<template>
  <div v-if="managementReady" class="dashboard-root" :class="{'multi-cluster': isRancher, 'back-to-rancher': backToRancherLink}">
    <div class="cluster">
      <div class="logo" alt="Logo" />
      <ClusterSwitcher v-if="isRancher" />
    </div>

    <div class="top">
      <NamespaceFilter v-if="clusterReady" />
    </div>

    <div v-if="backToRancherLink" class="back">
      <a v-t="'header.backToRancher'" :href="backToRancherLink" />
    </div>

    <div class="user">
      <v-popover
        placement="bottom"
        offset="-10"
        trigger="hover"
        :delay="{show: 0, hide: 200}"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <div class="text-right">
          <img v-if="principal && principal.avatarSrc" :src="principal.avatarSrc" width="40" height="40" />
          <i v-else class="icon icon-user icon-3x" />
        </div>

        <template slot="popover">
          <ul class="list-unstyled dropdown" style="margin: -1px;">
            <li>
              <div>{{ principal.loginName }}</div>
              <div class="text-small pb-10">
                {{ principal.name }}
              </div>
            </li>
            <nuxt-link tag="li" :to="{name: 'prefs'}" class="pt-5 pb-5 hand">
              <a>Preferences <i class="icon icon-fw icon-gear" /></a>
            </nuxt-link>
            <nuxt-link v-if="isRancher" tag="li" :to="{name: 'auth-logout'}" class="pt-5 pb-5 hand">
              <a>Log Out <i class="icon icon-fw icon-close" /></a>
            </nuxt-link>
          </ul>
        </template>
      </v-popover>
    </div>

    <nav v-if="clusterReady">
      <Jump class="mt-10 mb-10" />

      <div v-for="g in groups" :key="g.name" class="package">
        <Group
          :key="g.name"
          id-prefix=""
          :is-expanded="isExpanded"
          :group="g"
          :custom-header="true"
          :can-collapse="true"
        >
          <template slot="accordion">
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </div>
    </nav>

    <main v-if="clusterReady">
      <nuxt class="outlet" />
      <Footer />
    </main>

    <!--
    <div class="wm">
      <WindowManager />
    </div>
    -->

    <ShellSocket />
    <ActionMenu />
    <PromptRemove />
    <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleNoneLocale()" />
    <button v-shortkey.once="['f8']" class="hide" @shortkey="wheresMyDebugger" />
  </div>
</template>

<style lang="scss">
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "cluster  top   back user"
      "nav      main  main main"
      "nav      main  main main"
      "wm       wm    wm   wm";

    grid-template-columns: var(--nav-width)     auto 0px                  var(--header-height);
    grid-template-rows:    var(--header-height) auto var(--footer-height) var(--wm-height, 0px);

    &.back-to-rancher {
      grid-template-columns: var(--nav-width) auto 150px var(--header-height);
    }

    > .cluster {
      grid-area: cluster;
      background-color: var(--header-dropdown);
      position: relative;

      .logo {
        background-color: var(--header-logo);
        mask: url("~assets/images/logo.svg") no-repeat center;
        height: 30px;
        width: 64px;
        position: absolute;
        top: 9px;
        left: -30px;
        z-index: 2;
      }
    }

    > .top {
      grid-area: top;
      background-color: var(--header-bg);
      padding-top: 8px;

      INPUT[type='search']::placeholder,
      .vs__open-indicator,
      .vs__selected {
        color: white!important;
      }

      .vs__selected {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .vs__deselect {
        fill: white;
      }

      .filter {
        margin-left: 10px;

        .vs__dropdown-toggle {
          background: var(--header-dropdown);
          border-radius: var(--border-radius);
          border: none;
        }
      }
    }

    > .back {
      grid-area: back;
      background-color: var(--header-bg);

      A {
        line-height: var(--header-height);
        display: block;
        color: white;
        padding: 0 5px;
        margin-right: 20px;
        text-align: right;
      }
    }

    > .user {
      grid-area: user;
      background-color: var(--header-bg);
      padding: 5px;
    }

    NAV {
      grid-area: nav;
      position: relative;
      background-color: var(--nav-bg);
      padding: 0 10px;
      overflow-y: auto;

      .package .depth-0.expanded > .body {
        margin-bottom: 20px;
      }

      .header {
        background: transparent;
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
      height: var(--footer-height);
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

  .wm {
    grid-area: wm;
    overflow-y: hidden;
  }
</style>
