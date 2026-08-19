<script>
import ExplainPanel from './ExplainPanel';
import RcDrawer from '@components/RcDrawer/RcDrawer.vue';
import RcDrawerCard from '@components/RcDrawer/RcDrawerCard.vue';
import RcDrawerMessage from '@components/RcDrawer/RcDrawerMessage.vue';
import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils.ts';
import { openAPICache } from '../open-api';

export default {
  name: 'ExplainDrawer',

  components: {
    ExplainPanel,
    RcDrawer,
    RcDrawerCard,
    RcDrawerMessage
  },

  props: {
    schema: {
      type:    Object,
      default: null
    },

    clusterId: {
      type:    String,
      default: 'local'
    }
  },

  data() {
    return {
      busy:        true,
      definition:  undefined,
      definitions: {},
      breadcrumbs: undefined,
      expandAll:   false,
      error:       false,
      noResource:  false,
      notFound:    false,
    };
  },

  async mounted() {
    try {
      this.load(await openAPICache.get(this.clusterId, this.$store.dispatch));
    } catch {
      this.load(undefined);
    }
  },

  computed: {
    title() {
      return this.t('kubectl-explain.title');
    },

    actions() {
      if (this.busy || this.noResource || !this.definition) {
        return [];
      }

      return [{
        label:   this.expandAll ? this.t('kubectl-explain.collapseAll') : this.t('kubectl-explain.expandAll'),
        variant: 'secondary',
        testid:  'explain-expand-all',
        action:  () => this.toggleAll()
      }];
    }
  },

  methods: {
    scrollTop() {
      this.$refs.drawer?.scrollToTop();
    },

    toggleAll() {
      this.expandAll = !this.expandAll;
    },

    load(data) {
      this.noResource = false;
      this.error = false;
      this.notFound = false;

      if (!this.schema) {
        this.busy = false;
        this.noResource = true;
        this.notFound = true;

        return;
      }

      if (!data) {
        this.busy = false;
        this.error = true;

        return;
      }

      let name = getOpenAPISchemaName(this.schema);

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

      this.$nextTick(() => this.scrollTop());
    }
  }
};
</script>

<template>
  <RcDrawer
    ref="drawer"
    :title="title"
    :loading="busy"
    :actions="actions"
  >
    <template #body>
      <!--
        The breadcrumb trail lives in the body rather than the drawer title,
        because the title is a heading and takes phrasing content only, and
        because the drawer's accessible name should stay "Kubernetes Explain"
        rather than becoming whatever the user has drilled into.
      -->
      <nav
        v-if="breadcrumbs && !noResource"
        class="breadcrumbs"
        :aria-label="title"
      >
        <template
          v-for="(b, i) in breadcrumbs"
          :key="b.id"
        >
          <span
            v-if="i > 0"
            class="separator"
            aria-hidden="true"
          >&gt;</span>
          <span v-if="i === breadcrumbs.length - 1">{{ b.name }}</span>
          <a
            v-else
            href="#"
            class="breadcrumb-link"
            :aria-label="t('kubectl-explain.navigateToBreadcrumb', { breadcrumb: b.name })"
            @click.prevent="navigate(breadcrumbs.slice(0, i + 1))"
          >{{ b.name }}</a>
        </template>
      </nav>

      <RcDrawerCard>
        <ExplainPanel
          v-if="!noResource && definition"
          ref="main"
          class="explain-panel"
          :expand-all="expandAll"
          :definition="definition"
          @navigate="navigate"
        />
        <RcDrawerMessage
          v-else-if="error"
          icon="icon-error"
        >
          {{ t('kubectl-explain.errors.load') }}
        </RcDrawerMessage>
        <RcDrawerMessage
          v-else
          icon="icon-book"
        >
          {{ notFound ? t('kubectl-explain.errors.notFound') : t('kubectl-explain.prompt') }}
        </RcDrawerMessage>
      </RcDrawerCard>
    </template>
  </RcDrawer>
</template>

<style lang="scss" scoped>
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;

  .separator {
    opacity: 0.6;
  }

  .breadcrumb-link {
    color: var(--body-text);

    &:hover {
      color: var(--link);
    }
  }
}

// The schema tree wants the card's full width to indent into, but prose at that
// width runs to ~160 characters a line, which is past the point the eye can find
// the start of the next one. Cap the measure without narrowing the drawer.
.explain-panel {
  :deep(.definition-description),
  :deep(.markdown) {
    max-width: 90ch;
  }
}
</style>
