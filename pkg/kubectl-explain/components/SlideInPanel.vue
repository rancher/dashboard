<script>
import ExplainPanel from './ExplainPanel';
import { RcDrawer } from '@components/RcDrawer';
import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils.ts';
import { openAPI } from '../open-api';

export default {
  components: { ExplainPanel, RcDrawer },

  emits: ['close'],

  props: {
    schema: {
      type:    Object,
      default: undefined
    },

    cluster: {
      type:    String,
      default: undefined
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

  created() {
    openAPI.get(this.cluster, this.$store.dispatch).then((data) => {
      this.load(data, this.schema);
    }).catch((e) => {
      this.load(undefined, this.schema, e);
    });
  },

  computed: {

    /**
     * Id of the type on screen - navigate() lands on the last breadcrumb
     */
    definitionId() {
      return this.breadcrumbs?.[this.breadcrumbs.length - 1]?.id || '';
    }
  },

  methods: {
    scrollTop() {
      this.$refs.content?.scrollIntoView({ block: 'start' });
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
  <RcDrawer
    :title="t('kubectl-explain.title')"
    @close="$emit('close')"
  >
    <template #title>
      <nav
        v-if="breadcrumbs && !noResource"
        class="breadcrumbs"
      >
        <div
          v-for="(b, i) in breadcrumbs"
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
        class="title-text"
      >
        {{ t('kubectl-explain.title') }}
      </div>
      <button
        v-if="!busy && !noResource && definition"
        type="button"
        class="btn role-link expand-all"
        :aria-label="expandAll ? t('kubectl-explain.collapseAll') : t('kubectl-explain.expandAll')"
        :aria-expanded="expandAll"
        @click="toggleAll()"
      >
        <i class="icon icon-sort" />
      </button>
    </template>
    <div
      ref="content"
      class="content"
      data-testid="slide-in-panel-resource-explain"
    >
      <div
        v-if="busy"
        class="loading"
      >
        <i
          class="icon icon-lg icon-spinner icon-spin"
          :alt="t('kubectl-explain.informationLoading')"
        />
      </div>
      <ExplainPanel
        v-if="!noResource && definition"
        :expand-all="expandAll"
        :definition="definition"
        :definition-id="definitionId"
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
    </div>
  </RcDrawer>
</template>

<style lang="scss" scoped>
  .title-text {
    flex: 1;
  }

  .breadcrumbs {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    min-width: 0;

    .breadcrumb-link {
      color: var(--text);

      &:hover {
        color: var(--link);
      }
    }
  }

  .expand-all {
    $size: 24px;

    display: inline-flex;
    flex-shrink: 0;
    justify-content: center;
    width: $size;
    height: $size;
    margin-left: 8px;
    color: var(--body-text);
  }

  .content {
    scroll-margin-top: 16px;
  }

  .explain-panel {
    max-width: 90ch;
  }

  .loading {
    display: flex;
    justify-content: center;
    padding: 20px;

    .icon-spinner {
      font-size: 24px;
    }
  }

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
</style>
