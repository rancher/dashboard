<script>
import { CAPI } from '@shell/config/types';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name:       'OsImages',
  components: {
    Loading, LabeledInput, LabeledSelect, CruResource
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  async fetch() {
    const rancherClusters = await this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });

    this.rancherClusters = rancherClusters;
  },
  data() {
    return { rancherClusters: [], clusterTargets: this.handleClusterTargets() };
  },
  computed: {
    clusterTargetOptions() {
      return this.rancherClusters.map((cluster) => {
        return {
          label: cluster.name,
          value: cluster.name
        };
      });
    }
  },
  methods: {
    handleClusterTargets() {
      if (this.value?.spec?.clusterTargets?.length) {
        return this.value?.spec?.clusterTargets[0].clusterName;
      }

      return this.value?.spec?.clusterTargets;
    },
    updateClusterTargets(opt) {
      this.value.spec.clusterTargets = [
        { clusterName: opt.value }
      ];
    }
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :can-yaml="false"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
  >
    <h1>OsImages</h1>
    <div class="row mt-40 mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.configuration') }}</h3>
        <LabeledInput
          v-model.trim="value.metadata.name"
          :required="true"
          :label="t('elemental.osimage.create.name.label')"
          :placeholder="t('elemental.osimage.create.name.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
    <div v-if="value.spec" class="row mb-10">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.spec') }}</h3>
        <LabeledSelect
          v-model.trim="clusterTargets"
          class="mb-40"
          :label="t('elemental.osimage.create.targetCluster.label')"
          :placeholder="t('elemental.osimage.create.targetCluster.placeholder', null, true)"
          :mode="mode"
          :options="clusterTargetOptions"
          @selecting="updateClusterTargets"
        />
        <LabeledInput
          v-model.trim="value.spec.osImage"
          :label="t('elemental.osimage.create.osImage.label')"
          :placeholder="t('elemental.osimage.create.osImage.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>

</style>
