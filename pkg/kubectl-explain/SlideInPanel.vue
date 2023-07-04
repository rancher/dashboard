<script>
import ExplainPanel from './ExplainPanel';
import { KEY } from '@shell/utils/platform';

// Regex for more info in descriptions
const MORE_INFO_REGEX = /More info:\s*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;

export default {
  components: { ExplainPanel },

  props: {
    typeName: {
      type:    String,
      default: ''
    },
    schema: {
      type:    Object,
      default: () => {}
    },
  },

  data() {
    return {
      isOpen:         false,
      definition:     undefined,
      busy:           true,
      expandAll:      false,
      isResizing:     false,
      resizeLeft:     '',
      resizePosition: 'absolute',
      width:          '33%',
      right:          '-33%',
      breadcrumbs:    undefined,
      definitions:    {},
      noResource:     false,
    };
  },

  computed: {
    title() {
      if (this.noResource) {
        return 'Explain';
      }

      return this.schema?.attributes?.kind || 'Loading ...';
    }
  },

  methods: {
    open() {
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
    extractMoreInfo(property) {
      const description = property.description || '';
      const found = description.match(MORE_INFO_REGEX);

      if (found?.length > 0) {
        let url = found[0];
        const updated = description.replace(url, '').trim();
        const index = url.indexOf('http');

        url = url.substr(index);

        if (url.endsWith('.')) {
          url = url.substr(0, url.length - 1);
        }

        property.$moreInfo = url;
        property.description = updated;
      }
    },

    parse(property) {
      this.extractMoreInfo(property);
    },

    expand(definitions, definition, breadcrumbs = []) {
      Object.keys(definition?.properties || {}).forEach((propName) => {
        const prop = definition.properties[propName];
        const propRef = prop.$ref || prop.items?.$ref;

        if (propRef && propRef.startsWith('#/definitions/')) {
          const p = propRef.split('/');
          const id = p[p.length - 1];

          const ref = definitions[id];

          if (ref) {
            prop.$$ref = ref;
            prop.$refName = id;
            prop.$breadcrumbs = [
              ...breadcrumbs,
              id,
            ];

            const parts = prop.$refName.split('.');

            prop.$refNameShort = parts[parts.length - 1];

            this.expand(definitions, ref, prop.$breadcrumbs);
          } else {
            console.warn(`Can not find definition for ${ id }`); // eslint-disable-line no-console
          }
        }

        this.parse(prop);
      });
    },

    toggleAll() {
      this.expandAll = !this.expandAll;
    },

    update(response) {
      this.noResource = false;

      if (response.error) {
        this.busy = false;

        return;
      }

      const data = response.data;

      if (!data) {
        return;
      }

      const schema = response.schema;

      if (!schema) {
        this.busy = false;
        this.noResource = true;

        return;
      }

      if (schema?.attributes) {
        let group = schema.attributes.group || 'core';

        if (!group.includes('.')) {
          group = `io.k8s.api.${ group }`;
        } else {
          // Reverse the group
          group = group.split('.').reverse().join('.');
        }

        const name = `${ group }.${ schema.attributes.version }.${ schema.attributes.kind }`;
        const defn = data.definitions[name];

        this.definitions = data.definitions;

        this.expand(data.definitions, defn, [name]);

        this.definition = defn;
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
      const defn = this.definitions[goto];

      this.breadcrumbs = breadcrumbs.map((item) => {
        let name = item.split('.');

        name = name[name.length - 1];

        return {
          name,
          id: item
        };
      });

      // this.expand(this.definitions, defn, [goto]);
      this.expand(this.definitions, defn, breadcrumbs);

      // console.log(JSON.parse(JSON.stringify(defn, null, 2)));

      this.definition = defn;
      this.expanded = {};
      this.expandAll = false;

      setTimeout(() => this.scrollTop(), 100);
    },

    goto(id) {
      const breadcrumbs = [];

      for (let i = 0; i < this.breadcrumbs.length; i++) {
        const b = this.breadcrumbs[i];

        breadcrumbs.push(b);

        if (b.id === id) {
          break;
        }
      }

      this.navigate(breadcrumbs.map(b => b.id));
    }
  },
};
</script>

<template>
  <div>
    <div
      class="slide-in-glass"
      :class="{ 'slide-in-glass-open': isOpen }"
      @click="close()" />
    <div
      class="slide-in"
      :class="{ 'slide-in-open': isOpen }"
      :style="{ width, right }"
    >
      <div
        ref="resizer"
        class="panel-resizer"
        v-bind:style="{ position: resizePosition, left: resizeLeft }"
        @pointerdown="startPanelResize"
        @pointermove="doPanelResize"
        @pointerup="endPanelResize"
      />
      <div class="main-panel">
        <!-- <div class="glass" /> -->
        <div class="header">
          <div
            v-if="breadcrumbs"
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
              <a
                href="#"
                class="breadcrumb-link"
                @click="goto(b.id)"
              >{{ b.name }}</a>
            </div>
          </div>
          <div v-else @click="scrollTop()">{{ title }}</div>
          <i
            v-if="!busy"
            class="icon icon-sort mr-10"
            @click="toggleAll()"
          />
          <i
            class="icon icon-close"
            @click="close"
          />
        </div>
        <div v-if="busy"
          class="loading"
        >
          <div>
            <i class="icon icon-lg icon-spinner icon-spin" />
          </div>
        </div>
        <ExplainPanel
          ref="main"
          :expand-all="expandAll"
          v-if="definition"
          :definition="definition"
          class="explain-panel"
          @navigate="navigate"
        />
        <div
          v-if="noResource"
          class="select-resource"
        >
          <img src="./explain.svg">
          <div>
            Select a Kubernetes resource to get the resource explanation
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 55px;
  $slidein-width: 33%;

  .breadcrumbs {
    display: flex;

    .breadcrumb-link {
      color: var(--text);

      &:hover {
        color: var(--link);
      }
    }
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

      > img {
        margin-bottom: 20px;
        opacity: 0.5;
        height: 64px;
        width: 64px;
      }
    }
  }

  .header {
    align-items: center;
    display: flex;
    padding: 4px;
    border-bottom: 1px solid var(--border);

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
    background-color: #fff;
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
</style>
