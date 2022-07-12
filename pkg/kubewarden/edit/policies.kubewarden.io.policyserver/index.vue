<script>
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { KUBEWARDEN } from '../../types';
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';
import Config from './Config';
import Create from './Create';

export default {
  components: {
    CruResource, Config, Create
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    realMode: {
      type:    String,
      default: _EDIT
    },

    value: {
      type:     Object,
      required: true
    },
  },

  async fetch() {
    this.errors = [];

    await this.$store.getters['cluster/schemaFor'](KUBEWARDEN.POLICY_SERVER);
  },

  data() {
    return { errors: null };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    }
  },

  methods: {
    async finish(event) {
      try {
        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    }
  }
};
</script>

<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    :errors="errors"
    @finish="finish"
  >
    <Config :value="value" :mode="mode" />
  </CruResource>
</template>
