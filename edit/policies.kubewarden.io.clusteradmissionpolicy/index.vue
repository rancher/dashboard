<script>
import { KUBEWARDEN } from '@/config/types';
import { _CREATE, _EDIT } from '@/config/query-params';
import ChartMixin from '@/mixins/chart';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import ClusterAdmissionPolicy from './ClusterAdmissionPolicy';
import Create from './Create';

export default {
  name: 'CruClusterAdmissionPolicy',

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
    CruResource, ClusterAdmissionPolicy, Create
  },

  mixins: [ChartMixin, CreateEditView],

  async fetch() {
    await this.fetchChart();
  },

  data() {
    let type = this.$route.params.resource;

    if ( type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY ) {
      type = null;
    }

    return { type };
  },

  computed: {
    isCreate() {
      return this.realMode === _CREATE;
    },
  },

  methods: {
    selectType(type) {
      if (!this.type && type) {
        this.$router.replace({ params: { resource: type } });
      } else {
        this.type = type;
      }
    },
  }
};
</script>

<template>
  <Create v-if="isCreate" :value="value" :mode="mode" />
  <CruResource
    v-else
    :mode="realMode"
    :resource="value"
  >
    <ClusterAdmissionPolicy
      :value="value"
      :mode="realMode"
      :resource="type"
    />
  </CruResource>
</template>
