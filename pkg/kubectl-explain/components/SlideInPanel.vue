<script>
import ExplainPanel from './ExplainPanel';
import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils.ts';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import { OpenAPI } from '../open-api';

const HEADER_HEIGHT = 55;

// Cache of the Open API Data for a cluster
const openAPI = new OpenAPI();

export default {
  components: { ExplainPanel, Drawer },

  emits: ['close'],

  props: {
    schema: {
      type:    Object,
      default: () => {}
    },
    cluster: {
      type:    Object,
      default: () => undefined
    }
  },

  data() {
    return {
      definition:  undefined,
      busy:        true,
      error:       false,
      expandAll:   false,
      breadcrumbs: undefined,
      definitions: {},
      noResource:  false,
      notFound:    false,
    };
  },

  computed: {

    top() {
      const banner = document.getElementById('banner-header');
      let height = HEADER_HEIGHT;

      if (banner) {
        height += banner.clientHeight;
      }

      return `${ height }px`;
    },

    height() {
      return `calc(100vh - ${ this.top })`;
    }
  },

  created() {
    openAPI.get(this.cluster?.id, this.$store.dispatch).then((data) => {
      this.load(data, this.schema);
    }).catch((e) => {
      this.load(undefined, this.schema, e);
    });
  },

  methods: {
    scrollTop() {
      this.$refs.main.$el.scrollTop = 0;
    },

    toggleAll() {
      this.expandAll = !this.expandAll;
    },

    load(data, schema, error) {
      this.noResource = false;
      this.error = false;
      this.notFound = false;

      if (!schema) {
        this.busy = false;
        this.noResource = true;
        this.notFound = true;

        return;
      }

      if (error || !data) {
        this.busy = false;
        this.error = true;

        return;
      }

      let name = getOpenAPISchemaName(schema);

      // Manual fix ups where the schema group does not match the Open API one

      // Schemas like 'ingress' seem to have the wrong group - so try the other one with 'api'
      if (!data.definitions[name]) {
        name = name.replace(/io\.k8s\./g, 'io.k8s.api.');
      }

      // RBAC (e.g Role): io.k8s.api.authorization.rbac.v1.* -> io.k8s.api.rbac.v1.*
      if (!data.definitions[name]) {
        name = name.replace(/io\.k8s\.api\.authorization\.rbac/g, 'io.k8s.api.rbac');
      }

      if (name) {
        this.definitions = data.definitions;
        this.navigate([makeOpenAPIBreadcrumb(name)]);
      } else {
        this.definition = undefined;
      }

      this.busy = false;
    },

    navigate(breadcrumbs) {
      const goto = breadcrumbs[breadcrumbs.length - 1];

      this.breadcrumbs = breadcrumbs;
      this.definition = this.definitions[goto.id];
      this.expanded = {};
      this.expandAll = false;
      this.notFound = false;

      if (!this.definition) {
        this.noResource = true;
        this.notFound = true;

        return;
      }

      expandOpenAPIDefinition(this.definitions, this.definition, this.breadcrumbs);

      setTimeout(() => this.scrollTop(), 100);
    }
  }
};
</script>

<template>
  <Drawer
    @close="$emit('close')"
  >
    <template #title>
      <nav
        v-if="breadcrumbs"
        class="breadcrumbs"
      >
        <div v-if="noResource">
          {{ t('kubectl-explain.title') }}
        </div>
        <div
          v-for="(b, i) in breadcrumbs"
          v-else
          :key="b.id"
        >
          <span
            v-if="i > 0"
            class="ml-5 mr-5"
          >&gt;</span>
          <span
            v-if="i === breadcrumbs.length - 1"
          >{{ b.name }}
          </span>
          <a
            v-else
            href="#"
            class="breadcrumb-link"
            role="button"
            :aria-label="t('kubectl-explain.navigateToBreadcrumb', { breadcrumb: b.name })"
            @click="navigate(breadcrumbs.slice(0, i + 1))"
            @keydown.enter.space.stop.prevent="navigate(breadcrumbs.slice(0, i + 1))"
          >{{ b.name }}</a>
        </div>
      </nav>
      <div
        v-else
        class="scroll-title"
      >
        <span
          role="button"
          :aria-label="t('kubectl-explain.scrollToTop')"
          tabindex="0"
          @click="scrollTop()"
          @keydown.space.enter.stop.prevent="scrollTop()"
        >{{ t('kubectl-explain.title') }}</span>
      </div>
      <i
        v-if="!busy && !noResource && definition"
        class="icon icon-sort mr-10"
        role="button"
        :aria-label="t('kubectl-explain.expandAll')"
        tabindex="0"
        @click="toggleAll()"
        @keydown.space.enter.stop.prevent="toggleAll()"
      />
    </template>
    <template #body>
      <div
        v-if="busy"
        class="loading panel-loading"
      >
        <div>
          <i
            class="icon icon-lg icon-spinner icon-spin"
            :alt="t('kubectl-explain.informationLoading')"
          />
        </div>
      </div>
      <ExplainPanel
        v-if="!noResource && definition"
        ref="main"
        :expand-all="expandAll"
        :definition="definition"
        class="explain-panel"
        @navigate="navigate"
      />
      <div
        v-if="error"
        class="select-resource"
      >
        <i
          class="icon icon-error"
          :alt="t('kubectl-explain.errorLoading')"
        />
        <div>
          {{ t('kubectl-explain.errors.load') }}
        </div>
      </div>
      <div
        v-if="noResource"
        class="select-resource"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          viewBox="0 -960 960 960"
          width="24"
        >
          <path d="M260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-494Z" />
        </svg>
        <div v-if="notFound">
          {{ t('kubectl-explain.errors.notFound') }}
        </div>
        <div v-else>
          {{ t('kubectl-explain.prompt') }}
        </div>
      </div>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
  .scroll-title span:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }

  .main-panel {
    padding-left: 4px;
    display: flex;
    flex-direction: column;
    overflow: auto;

    .select-resource {
      font-size: 16px;
      margin: 40px;
      text-align: center;

      > svg, i {
        margin-bottom: 20px;
        opacity: 0.5;
        height: 64px;
        width: 64px;
      }

      // Ensure the icon uses the correct color for the theme
      > svg {
        fill: var(--body-text);
      }

      > i {
        font-size: 64px;
      }
    }
  }

  :deep() .title {
    flex: 1;
    justify-content: space-between;
    align-items: center;
    display: inline-flex;

    .breadcrumbs {
      display: flex;
      flex-wrap: wrap;

      .breadcrumb-link {
        color: var(--text);

        &:hover {
          color: var(--link);
        }
      }
    }

    > :first-child {
      flex: 1;
      font-weight: bold;
    }

    > i {
      padding: 8px;
      opacity: 0.7;

      &:hover {
        background-color: var(--primary);
        color: var(--primary-text);
        cursor: pointer;
        opacity: 1;
      }
    }
  }

  .loading {
    margin-top: 20px;
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;

    .icon-spinner {
      font-size: 24px;
    }
  }

  .explain-panel {
    padding: 10px;
  }
</style>
