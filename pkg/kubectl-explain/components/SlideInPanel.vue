<script>
import ExplainPanel from './ExplainPanel';
import { KEY } from '@shell/utils/platform';
import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils.ts';
import { useWatcherBasedSetupFocusTrapWithDestroyIncluded } from '@shell/composables/focusTrap';

const HEADER_HEIGHT = 55;

export default {
  components: { ExplainPanel },

  props: {
    schema: {
      type:    Object,
      default: () => {}
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

  created() {
    useWatcherBasedSetupFocusTrapWithDestroyIncluded(() => this.isOpen, '.slide-in', {
      escapeDeactivates: false,
      allowOutsideClick: true
    });
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
      :style="{ width, right, top, height }"
      data-testid="slide-in-panel"
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
          </div>
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
          <i
            role="button"
            :aria-label="t('kubectl-explain.scrollToTop')"
            class="icon icon-close"
            data-testid="slide-in-panel-close"
            tabindex="0"
            @click="close()"
            @keydown.space.enter.stop.prevent="close()"
          />
        </div>
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
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $slidein-width: 33%;

  .scroll-title span:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }

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
