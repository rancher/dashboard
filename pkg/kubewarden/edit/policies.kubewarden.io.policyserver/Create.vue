<script>
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { _CREATE } from '@shell/config/query-params';
import { SCHEMA } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import { createYaml } from '@shell/utils/create-yaml';
import { clone } from '@shell/utils/object';

import Loading from '@shell/components/Loading';
import CruResource from '@shell/components/CruResource';

import defaultPolicyServer from '../../questions/defaultPolicyServer.json';
import Values from './Values';

export default {
  name: 'Create',

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
    Loading, Values, CruResource
  },

  mixins: [CreateEditView],

  fetch() {
    this.errors = [];

    const _defaultJson = cloneDeep(JSON.parse(JSON.stringify(defaultPolicyServer)));

    this.chartValues = { questions: _defaultJson };

    this.value.apiVersion = `${ this.schema?.attributes?.group }.${ this.schema?.attributes?.version }`;
    this.value.kind = this.schema?.attributes?.kind;
  },

  data() {
    return {
      errors:      null,
      chartValues: null,
    };
  },

  methods: {
    clearErrors() {
      this.errors = [];
    },

    async finish(event) {
      try {
        merge(this.value, this.chartValues?.questions);

        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    },

    generateYaml() {
      const inStore = this.$store.getters['currentStore'](this.value);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const cloned = this.chartValues?.questions ? clone(this.chartValues.questions) : this.value;

      const out = createYaml(schemas, this.value.type, cloned);

      return out;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="relative" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    :done-route="doneRoute"
    :errors="errors"
    :generate-yaml="generateYaml"
    @finish="finish"
    @error="clearErrors"
  >
    <Values :value="value" :chart-values="chartValues" :mode="mode" />
  </CruResource>
</template>
