<script>
import ExplainPanel from './ExplainPanel';
import { KEY } from '@shell/utils/platform';
import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils.ts';

export default {
  components: { ExplainPanel },

  props: {
    schema: {
      type:    Object,
      default: () => {}
    },
    $t: {
      type:     Function,
      required: true,
    }
  },

  data() {
    return {
      isOpen:         false,
      definition:     undefined,
      busy:           true,
      error:          false,
      expandAll:      false,
      isResizing:     false,
      resizeLeft:     '',
      resizePosition: 'absolute',
      width:          '33%',
      right:          '-33%',
      breadcrumbs:    undefined,
      definitions:    {},
      noResource:     false,
      notFound:       false,
    };
  },

  methods: {
    open() {
      this.busy = true;
      this.isOpen = true;
      this.addCloseKeyHandler();
      this.right = '0';
    },

    close() {
      this.isOpen = false;
      this.removeCloseKeyHandler();
      this.right = `-${ this.width }`;
    },

    scrollTop() {
      this.$refs.main.$el.scrollTop = 0;
    },

    addCloseKeyHandler() {
      document.addEventListener('keyup', this.closeKeyHandler);
    },

    removeCloseKeyHandler() {
      document.removeEventListener('keyup', this.closeKeyHandler);
    },

    closeKeyHandler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.close();
      }
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

      // Schemas like 'ingress' seem to have the wrong group - so try the other one with 'api'
      if (!data.definitions[name]) {
        name = name.replace(/io\.k8s\./g, 'io.k8s.api.');
      }

      if (name) {
        this.definitions = data.definitions;
        this.navigate([makeOpenAPIBreadcrumb(name)]);
      } else {
        this.definition = undefined;
      }

      this.busy = false;
    },

    startPanelResize(ev) {
      this.isResizing = true;
      this.$refs.resizer.setPointerCapture(ev.pointerId);
    },

    doPanelResize(ev) {
      if (this.isResizing) {
        this.resizePosition = 'fixed';
        this.resizeLeft = `${ ev.clientX }px`;
      }
    },

    endPanelResize(ev) {
      this.isResizing = false;
      this.$refs.resizer.releasePointerCapture(ev.pointerId);

      const width = window.innerWidth - ev.clientX + 2;

      this.resizePosition = 'absolute';
      this.resizeLeft = '';

      this.width = `${ width }px`;
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
  <div>
    <div
      class="slide-in-glass"
      :class="{ 'slide-in-glass-open': isOpen }"
      @click="close()"
    />
    <div
      class="slide-in"
      :class="{ 'slide-in-open': isOpen }"
      :style="{ width, right }"
    >
      <div
        ref="resizer"
        class="panel-resizer"
        :style="{ position: resizePosition, left: resizeLeft }"
        @pointerdown="startPanelResize"
        @pointermove="doPanelResize"
        @pointerup="endPanelResize"
      />
      <div class="main-panel">
        <div class="header">
          <div
            v-if="breadcrumbs"
            class="breadcrumbs"
          >
            <div v-if="noResource">
              {{ $t('kubectl-explain.title') }}
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
                @click="navigate(breadcrumbs.slice(0, i + 1))"
              >{{ b.name }}</a>
            </div>
          </div>
          <div
            v-else
            @click="scrollTop()"
          >
            {{ $t('kubectl-explain.title') }}
          </div>
          <i
            v-if="!busy && !noResource && definition"
            class="icon icon-sort mr-10"
            @click="toggleAll()"
          />
          <i
            class="icon icon-close"
            @click="close"
          />
        </div>
        <div
          v-if="busy"
          class="loading panel-loading"
        >
          <div>
            <i class="icon icon-lg icon-spinner icon-spin" />
          </div>
        </div>
        <ExplainPanel
          v-if="!noResource && definition"
          ref="main"
          :expand-all="expandAll"
          :definition="definition"
          :$t="$t"
          class="explain-panel"
          @navigate="navigate"
        />
        <div
          v-if="error"
          class="select-resource"
        >
          <i class="icon icon-error" />
          <div>
            {{ $t('kubectl-explain.errors.load') }}
          </div>
        </div>
        <div
          v-if="noResource"
          class="select-resource"
        >
          <img src="../explain.svg">
          <div v-if="notFound">
            {{ $t('kubectl-explain.errors.notFound') }}
          </div>
          <div v-else>
            {{ $t('kubectl-explain.prompt') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 55px;
  $slidein-width: 33%;

  .panel-resizer {
    position: absolute;
    height: 100%;
    border: 2px solid transparent;

    &:hover {
      border: 2px solid var(--primary);
      cursor: col-resize;
    }
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

      > img, i {
        margin-bottom: 20px;
        opacity: 0.5;
        height: 64px;
        width: 64px;
      }

      > i {
        font-size: 64px;
      }
    }
  }

  .header {
    align-items: center;
    display: flex;
    padding: 4px;
    border-bottom: 1px solid var(--border);

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
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;

    .icon-spinner {
      font-size: 24px;
    }
  }

  .glass {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }

  .slide-in {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    z-index: 2000;
    top: $header-height;
    height: calc(100vh - $header-height);
    width: $slidein-width;
    background-color: var(--body-bg);
    right: -$slidein-width;
    transition: right 0.5s;
    border-left: 1px solid var(--border);
  }

  .slide-in-open {
    right: 0;
  }

  .explain-panel {
    padding: 10px;
  }

  .slide-in-glass {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      height :100vh;
      width: 100vw;

    &.slide-in-glass-open {
      background-color: var(--body-bg);
      display: block;
      opacity: 0.5;
      z-index: 1000;
    }
  }

  .panel-loading {
    margin-top: 20px;
  }
</style>
