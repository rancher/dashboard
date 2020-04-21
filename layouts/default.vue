<script>
import { debounce } from 'lodash';
import { mapState } from 'vuex';
import { addObjects } from '../utils/array';
import { mapPref, DEV, EXPANDED_GROUPS, FAVORITE_TYPES } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import Jump from '@/components/nav/Jump';
// import WindowManager from '@/components/nav/WindowManager';
import ShellSocket from '@/components/ContainerExec/ShellSocket';
import PromptRemove from '@/components/PromptRemove';
import Group from '@/components/nav/Group';
import Header from '@/components/nav/Header';
import Footer from '@/components/nav/Footer';
import { COUNT, SCHEMA } from '@/config/types';
import { BASIC, FAVORITE, USED } from '@/store/type-map';

export default {

  components: {
    Jump,
    PromptRemove,
    Header,
    Footer,
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
    favoriteTypes:  mapPref(FAVORITE_TYPES),

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

    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },

    wheresMyDebugger() {
      // vue-shortkey is preventing F8 from passing through to the browser... this works for now.
      // eslint-disable-next-line no-debugger
      debugger;
    }
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     'Dashboard',
    };
  },

};
</script>

<template>
  <div v-if="managementReady" class="dashboard-root">
    <Header />

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
    <button v-if="dev" v-shortkey.once="['shift','t']" class="hide" @shortkey="toggleTheme()" />
    <button v-shortkey.once="['f8']" class="hide" @shortkey="wheresMyDebugger" />
  </div>
</template>

<style lang="scss">
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "header  header"
      "nav      main"
      "wm       wm";

    grid-template-columns: var(--nav-width)     auto;
    grid-template-rows:    var(--header-height) auto var(--wm-height, 0px);

    > HEADER {
      grid-area: header;
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
      display: flex;
      flex-direction: column;
      padding: 20px 20px 70px 20px;
      min-height: 100%;
      margin-bottom: calc(-1 * var(--footer-height) - 1px);
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
      }
    }

  }

  .wm {
    grid-area: wm;
    overflow-y: hidden;
  }
</style>
