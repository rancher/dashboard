<script>
import { _CREATE } from '@shell/config/query-params';

import Tab from '@shell/components/Tabbed/Tab';

import General from './General';
import Labels from './Labels';
import Registry from './Registry/Index';
import Verification from './Verification';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    General, Labels, Tab, Registry, Verification
  },

  data() {
    return { chartValues: this.value.questions };
  },

  computed: {
    targetNamespace() {
      if ( this.forceNamespace ) {
        return this.forceNamespace;
      } else if ( this.value?.metadata?.namespace ) {
        return this.value.metadata.namespace;
      }

      return 'default';
    },
  },

  methods: {
    refresh() {
      try {
        /*
          A forceUpdate is needed for certain inputs within the Tab component
          that calculate the height to show loaded data
        */
        const keys = this.$refs.registry.$refs.sourceAuthorities.$refs.authority;

        for ( const k of keys ) {
          k?.$forceUpdate();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Error refreshing authority refs: ${ e }`);
      }
    }
  }
};
</script>

<template>
  <div>
    <Tab name="general" label="General" :weight="99">
      <General v-model="chartValues" :mode="mode" />
    </Tab>
    <Tab name="labels" label="Labels & Annotations" :weight="98">
      <Labels v-model="chartValues.metadata" :mode="mode" />
    </Tab>
    <Tab name="verification" label="Verification" :weight="97">
      <Verification :value="chartValues.spec" :namespace="targetNamespace" :mode="mode" />
    </Tab>
    <Tab name="registry" label="Container Registry" :weight="96" @active="refresh">
      <Registry ref="registry" :value="chartValues.spec" :mode="mode" />
    </Tab>
  </div>
</template>
