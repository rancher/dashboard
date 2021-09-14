<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { _VIEW } from '@/config/query-params';
import { NORMAN } from '@/config/types';

export default {
  name: 'CruFleetCluster',

  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    const norman = await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.value.metadata.name });
    const nc = await this.$store.dispatch(`rancher/clone`, { resource: norman });

    if ( !nc.metadata ) {
      nc.metadata = {};
    }

    nc.metadata.labels = nc._labels || {};
    nc.metadata.annotations = nc._annotations || {};

    this.normanCluster = nc;
  },

  data() {
    return { normanCluster: null };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    async save(buttonDone) {
      try {
        await this.value.save();

        const nc = this.normanCluster;

        nc._labels = nc.metadata.labels;
        nc._annotations = nc.metadata.annotations;
        await nc.save();

        this.done();
        buttonDone(true);
      } catch (e) {
        buttonDone(false);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <hr class="mt-20 mb-20" />

    <Labels
      default-section-class="mt-20"
      :value="normanCluster"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
