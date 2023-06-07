<script>
import ExplainPanel from './ExplainPanel';

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
      isOpen: false,
      definition: undefined,
      busy: true,
    };
  },

  computed: {
    title() {
      console.log(this.schema);

      return this.schema?.attributes?.kind || 'Loading ...';
    }
  },

  methods: {
    open(typeName) {

      console.log('open');

      console.log(this);
      console.log(this.typeName);
      console.log(typeName);
      console.log(this.schema);

      console.log(this.$dispatch);

      this.isOpen = true;
    },

    close() {
      console.log('close');

      this.isOpen = false;
    },

    scrollTop() {
      //this.$refs.main.scrollTo(0,0);

      this.$refs.main.$el.scrollTop = 0;
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

      // Object.values(property.properties || {}).forEach((v) => {
      //   this.extractMoreInfo(v);

      //   // if (v.$ref) {
      //   //   this.parse(v.$ref);
      //   // }
      // });
    },

    expand(definitions, definition) {
      Object.keys(definition?.properties || {}).forEach((propName) => {
        const prop = definition.properties[propName];

        if (prop.$ref && prop.$ref.startsWith('#/definitions/')) {
          const p = prop.$ref.split('/');
          const id = p[p.length -1 ];

          const ref = definitions[id];

          if (ref) {
            prop.$$ref = ref;
            prop.$refName = id;

            const parts = prop.$refName.split('.');

            console.log(parts);

            prop.$refNameShort = parts[parts.length - 1];

            this.expand(definitions, ref);
          } else {
            console.warn('Can not find definition for ' + id);
          }
        }

        this.parse(prop);
      });
    },

    update(response) {
      if (response.error) {
        console.error(response.error);
        this.busy = false;

        return;
      }

      const data = response.data;

      if (!data) {
        return;
      }

      const schema = response.schema;

      console.error(schema);

      if (schema?.attributes) {
        let group = schema.attributes.group || 'core';

        if (!group.includes('.')) {
          group = `io.k8s.api.${ group }`;
        } else {
          // Reverse the group
          group = group.split('.').reverse().join('.');
        }

        const name = `${ group }.${ schema.attributes.version}.${ schema.attributes.kind}`;
        console.log(data);
        const defn = data.definitions[name];

        console.log('>>>>>>>>>>>>>>>>>>>>>>>');
        console.log(name);

        //Object.keys(data.definitions).forEach((key) => console.log(key));

        Object.keys(data.definitions).forEach((key) => {
          if (key.includes(schema.attributes.kind)) {
            console.log(key);
          }
        });

        console.log(defn);

        this.expand(data.definitions, defn);

        console.log(JSON.parse(JSON.stringify(defn, null, 2)));

        this.definition = defn;
      } else {
        this.definition = undefined;
      }

      this.busy = false;
    }
  },
};
</script>

<template>
  <div class="slide-in" :class="{ 'slide-in-open': isOpen }">
    <!-- <div class="glass" /> -->
    <div class="header">
      <div @click="scrollTop()">{{ title }}</div>
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
      v-if="definition"
      :definition="definition"
      class="explain-panel"
    />
  </div>
</template>

<style lang="scss" scoped>
  $header-height: 55px;
  $slidein-width: 33%;

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
</style>
