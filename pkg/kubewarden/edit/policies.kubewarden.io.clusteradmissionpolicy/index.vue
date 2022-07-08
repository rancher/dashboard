<script>
import { _CREATE, _EDIT } from '@shell/config/query-params';
import ChartMixin from '@shell/mixins/chart';
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';
import Config from '../policies.kubewarden.io/Config';
import Create from '../policies.kubewarden.io/Create';

export default {
  name: 'ClusterAdmissionPolicy',

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    realMode: {
      type:    String,
      default: _EDIT
    }
  },

  components: {
    CruResource, Config, Create
  },

  mixins: [ChartMixin, CreateEditView],

  async fetch() {
    await this.fetchChart();
  },

  provide() {
    return { chartType: this.value.type };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },
  },

  methods: {
    async finish(event) {
      try {
        await this.save(event);
      } catch (e) {
        this.errors.push(e);
      }
    },
  }
};
</script>

<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :resource="value"
    :mode="realMode"
    @finish="finish"
  >
    <Config :value="value" :mode="mode" />
  </CruResource>
</template>
