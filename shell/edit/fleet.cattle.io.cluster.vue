<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { _VIEW } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { FLEET } from '@shell/config/labels-annotations';

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
    const norman = await this.$store.dispatch('rancher/find', { type: NORMAN.CLUSTER, id: this.value.metadata.labels[FLEET.CLUSTER_NAME] });
    const nc = await this.$store.dispatch(`rancher/clone`, { resource: norman });

    if ( !nc.metadata ) {
      nc.metadata = {};
    }

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

        await this.normanCluster.save();

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
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="isNamespaced"
    />

    <hr class="mt-20 mb-20">

    <Labels
      default-section-class="mt-20"
      :value="normanCluster"
      :mode="mode"
      :display-side-by-side="false"
      :label-title-tooltip="t('labels.labels.fleetClusterTooltip')"
    />
  </CruResource>
</template>
