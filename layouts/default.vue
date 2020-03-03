
<script>
import { mapState } from 'vuex';
import { addObject, removeObject } from '@/utils/array';
import {
  mapPref, DEV, THEME, EXPANDED_GROUPS, NAV_SHOW
} from '@/store/prefs';
import { allTypes, getTree } from '@/config/nav-cluster';
import applyTypeConfigs from '@/config/type-config';
import ActionMenu from '@/components/ActionMenu';
import ButtonGroup from '@/components/ButtonGroup';
import NamespaceFilter from '@/components/nav/NamespaceFilter';
import ClusterSwitcher from '@/components/nav/ClusterSwitcher';
import WindowManager from '@/components/nav/WindowManager';
import ShellSocket from '@/components/ContainerExec/ShellSocket';
import PromptRemove from '@/components/PromptRemove';
import Group from '@/components/nav/Group';
import Footer from '@/components/nav/Footer';
import { NORMAN, RANCHER } from '@/config/types';

applyTypeConfigs();

export default {

  components: {
    ClusterSwitcher,
    PromptRemove,
    Footer,
    NamespaceFilter,
    ActionMenu,
    ButtonGroup,
    Group,
    ShellSocket,
    WindowManager
  },

  middleware: ['authenticated'],

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     'Dashboard',
    };
  },

  data() {
    return { packages: [] };
  },

  computed: {
    ...mapState(['managementReady', 'clusterReady']),

    dev:            mapPref(DEV),
    expandedGroups: mapPref(EXPANDED_GROUPS),
    navShow:        mapPref(NAV_SHOW),

    multiCluster() {
      return this.$store.getters['management/hasType'](RANCHER.CLUSTER);
    },

    backToRancherLink() {
      if ( !this.multiCluster ) {
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

    navOptions() {
      return this.$store.getters['prefs/options'](NAV_SHOW).map((value) => {
        return {
          label: `nav.show.${ value }`,
          value
        };
      });
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    groups() {
      const clusterId = this.$store.getters['clusterId'];
      const namespaces = this.$store.getters['namespaces'] || [];
      const types = allTypes(this.$store);
      const mode = this.navShow;
      const currentType = this.$route.params.resource || '';

      if ( !types ) {
        return [];
      }

      const out = getTree(mode, clusterId, types, namespaces, currentType);

      return out;
    }
  },

  /*
  watch: {
    allTypes() {
      this.getTree();
    }
  },
*/

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

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    }
  }
};
</script>

<template>
  <div v-if="managementReady" class="dashboard-root" :class="{'multi-cluster': multiCluster, 'back-to-rancher': backToRancherLink}">
    <div class="cluster">
      <div class="logo" alt="Logo" />
      <ClusterSwitcher v-if="multiCluster" />
    </div>

    <div v-if="clusterReady" class="top">
      <NamespaceFilter />
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

    <nav v-if="clusterReady">
      <div v-for="g in groups" :key="g.name" class="package">
        <Group
          :key="g.name"
          id-prefix=""
          :is-expanded="isExpanded"
          :group="g"
          :toggle-group="toggleGroup"
          :custom-header="true"
          :can-collapse="true"
        >
          <template slot="accordion">
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </div>
    </nav>

    <div v-if="clusterReady" class="switcher">
      <ButtonGroup v-model="navShow" :options="navOptions" :labels-are-translations="true" />
    </div>

    <main v-if="clusterReady">
      <nuxt class="outlet" />
      <Footer />
    </main>

    <div class="wm">
      <WindowManager />
    </div>

    <ShellSocket />
    <ActionMenu />
    <PromptRemove />
    <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleNoneLocale()" />
  </div>
</template>

<style lang="scss">
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "cluster  top   back user"
      "nav      main  main main"
      "switcher main  main main"
      "wm       wm    wm   wm";

    grid-template-columns: var(--nav-width)     auto 0px                  var(--header-height);
    grid-template-rows:    var(--header-height) auto var(--footer-height) var(--wm-height, 0px);

    &.back-to-rancher {
      grid-template-columns: var(--nav-width) auto 150px var(--header-height);
    }

    > .cluster {
      grid-area: cluster;
      background-color: var(--header-bg);
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
        color: var(--body-text);
        padding: 0 5px;
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

      .package:not(:first-child) {
        margin-top: 20px;
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

    > .switcher {
      margin: 10px 0 0 0;
      text-align: center;
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
  }
</style>
