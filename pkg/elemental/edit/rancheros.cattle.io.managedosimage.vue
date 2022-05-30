<script>
import { CAPI } from '@shell/config/types';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';

export default {
  name:       'ManagedOsImagesEditView',
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
    },
    isCreate() {
      return this.mode === _CREATE;
    }
  },
  watch: {
    clusterTargets(neu) {
      this.value.spec.clusterTargets = neu.map((val) => {
        return { clusterName: val };
      });
    }
  },
  methods: {
    handleClusterTargets() {
      const clusterTargets = this.value?.spec?.clusterTargets;

      if (clusterTargets?.length) {
        const targetsArray = [];

        clusterTargets.forEach((ct) => {
          targetsArray.push(ct.clusterName);
        });

        return targetsArray;
      }

      return [];
    }
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :can-yaml="false"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div class="row mt-40 mb-20">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.configuration') }}</h3>
        <LabeledInput
          v-model.trim="value.metadata.name"
          :required="true"
          :label="t('elemental.osimage.create.name.label')"
          :placeholder="t('elemental.osimage.create.name.placeholder', null, true)"
          :mode="mode"
          :disabled="!isCreate"
        />
      </div>
    </div>
    <div v-if="value.spec" class="row mb-20">
      <div class="col span-6 mb-20">
        <h3>{{ t('elemental.osimage.create.spec') }}</h3>
        <LabeledSelect
          v-model="clusterTargets"
          class="mb-40"
          :label="t('elemental.osimage.create.targetCluster.label')"
          :placeholder="t('elemental.osimage.create.targetCluster.placeholder', null, true)"
          :mode="mode"
          :options="clusterTargetOptions"
          :multiple="true"
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
