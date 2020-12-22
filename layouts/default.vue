<script>
import debounce from 'lodash/debounce';
import { mapState, mapGetters } from 'vuex';
import { mapPref, DEV, EXPANDED_GROUPS, FAVORITE_TYPES } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import Jump from '@/components/nav/Jump';
import WindowManager from '@/components/nav/WindowManager';
import PromptRemove from '@/components/PromptRemove';
import AssignTo from '@/components/AssignTo';
import Group from '@/components/nav/Group';
import Header from '@/components/nav/Header';
import Footer from '@/components/nav/Footer';
import { COUNT, SCHEMA, MANAGEMENT } from '@/config/types';
import { BASIC, FAVORITE, USED } from '@/store/type-map';
import { addObjects, replaceWith, clear } from '@/utils/array';
import { NAME as EXPLORER } from '@/config/product/explorer';
import isEqual from 'lodash/isEqual';

export default {

  components: {
    Jump,
    PromptRemove,
    AssignTo,
    Header,
    Footer,
    ActionMenu,
    Group,
    WindowManager
  },

  data() {
    return { groups: [] };
  },

  middleware: ['authenticated'],

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'namespaceMode']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel' }),

    namespaces() {
      return this.$store.getters['namespaces']();
    },

    dev:            mapPref(DEV),
    expandedGroups: mapPref(EXPANDED_GROUPS),
    favoriteTypes:  mapPref(FAVORITE_TYPES),

    allSchemas() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/all`](SCHEMA);
    },

    counts() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      // So that there's something to watch for updates
      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        const counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        return counts;
      }

      return {};
    },

    showJump() {
      return this.productId === EXPLORER;
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

    locale(a, b) {
      if ( !isEqual(a, b) ) {
        this.getGroups();
      }
    },

    productId(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    namespaceMode(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    namespaces(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    clusterReady(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    product(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },
  },

  created() {
    this.queueUpdate = debounce(this.getGroups, 500);

    this.getGroups();
  },

  methods: {
    getGroups() {
      if ( !this.clusterReady ) {
        clear(this.groups);

        return;
      }

      const clusterId = this.$store.getters['clusterId'];
      const productId = this.$store.getters['productId'];
      const currentType = this.$route.params.resource || '';
      let namespaces = null;

      if ( !this.$store.getters['isAllNamespaces'] ) {
        namespaces = Object.keys(this.namespaces);
      }

      const namespaceMode = this.$store.getters['namespaceMode'];
      const out = [];
      const modes = [BASIC];

      if ( productId === EXPLORER ) {
        modes.push(FAVORITE);
        modes.push(USED);
      }
      for ( const mode of modes ) {
        const types = this.$store.getters['type-map/allTypes'](productId, mode) || {};
        const more = this.$store.getters['type-map/getTree'](productId, mode, types, clusterId, namespaceMode, namespaces, currentType);

        addObjects(out, more);
      }

      replaceWith(this.groups, ...out);
    },

    expanded(name) {
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
    },

    async toggleShell() {
      const clusterId = this.$route.params.cluster;

      if ( !clusterId || !this.$store.getters['isMultiCluster'] ) {
        return;
      }

      const cluster = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id:   clusterId,
      });

      if (!cluster ) {
        return;
      }

      cluster.openShell();
    }
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     this.$store.getters['i18n/t']('nav.title'),
    };
  },

};
</script>

<template>
  <div v-if="managementReady" class="dashboard-root">
    <Header />

    <nav v-if="clusterReady">
      <Jump v-if="showJump" class="m-10" />
      <div v-else class="mb-20" />
      <template v-for="(g, idx) in groups">
        <Group
          :key="idx"
          id-prefix=""
          class="package"
          :expanded="expanded"
          :group="g"
          :can-collapse="!g.isRoot"
          :show-header="!g.isRoot"
        >
          <template #header>
            <h6>{{ g.label }}</h6>
          </template>
        </Group>
      </template>
    </nav>

    <main v-if="clusterReady">
      <nuxt class="outlet" />
      <Footer />

      <ActionMenu />
      <PromptRemove />
      <AssignTo />
      <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleNoneLocale()" />
      <button v-if="dev" v-shortkey.once="['shift','t']" class="hide" @shortkey="toggleTheme()" />
      <button v-shortkey.once="['f8']" class="hide" @shortkey="wheresMyDebugger()" />
      <button v-shortkey.once="['`']" class="hide" @shortkey="toggleShell" />
    </main>

    <div class="wm">
      <WindowManager />
    </div>
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
      overflow-y: auto;

      .package.depth-0 {
        &.expanded > .body {
          margin-bottom: 5px;
        }
      }

      .header {
        background: transparent;
        padding-left: 10px;
      }

      H6, .root.child .label {
        margin: 0;
        letter-spacing: 0.1em;
        line-height: initial;

        A { padding-left: 0; }
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
      grid-template-areas:  "type-banner type-banner"
                            "title actions"
                            "state-banner state-banner";
      grid-template-columns: auto min-content;
      margin-bottom: 20px;
      align-items: center;
      min-height: 48px;

      .type-banner {
        grid-area: type-banner;
      }

      .state-banner {
        grid-area: state-banner;
      }

      .title {
        grid-area: title;
      }

      .actions-container {
        grid-area: actions;
        height: 100%;
        margin-left: 8px;
      }
    }

  }

  .wm {
    grid-area: wm;
    overflow-y: hidden;
  }
</style>
