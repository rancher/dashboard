<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { MANAGEMENT } from '@/config/types';
import { _VIEW } from '@/config/query-params';
import { NORMAN } from '@/config/types';
import { FLEET } from '@/config/labels-annotations';

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
    this.rancherCluster = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.CLUSTER,
      id:   this.$route.params.id
    });
    const norman = await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.value.metadata.labels[FLEET.CLUSTER_NAME] });
    const nc = await this.$store.dispatch(`rancher/clone`, { resource: norman });

    if ( !nc.metadata ) {
      nc.metadata = {};
    }

    nc.metadata.labels = nc._labels || {};
    nc.metadata.annotations = nc._annotations || {};

    this.normanCluster = nc;
  },

  data() {
    return { rancherCluster: null };
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
        await this.rancherCluster.save();
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
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <hr v-if="!isView" class="mt-20 mb-20" />

    <Labels
      v-if="!isView"
      default-section-class="mt-20"
      :value="rancherCluster"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
