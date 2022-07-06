<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { filterForElementalClusters } from '../utils/elemental-utils';
import { _CREATE } from '@shell/config/query-params';
import { CAPI } from '@shell/config/types';

export default {
  name:       'ManagedOsImagesEditView',
  components: {
    Loading, LabeledInput, LabeledSelect, CruResource, NameNsDescription
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

    this.elementalClusters = filterForElementalClusters(rancherClusters);
  },
  data() {
    return { elementalClusters: [], clusterTargets: this.handleClusterTargets() };
  },
  computed: {
    clusterTargetOptions() {
      return this.elementalClusters.map((cluster) => {
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
    :can-yaml="true"
    :mode="mode"
    :resource="value"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div class="row mt-40 mb-20">
      <div class="col span-12 mb-20">
        <h3>{{ t('elemental.osimage.create.configuration') }}</h3>
        <NameNsDescription v-model="value" :mode="mode" :description-hidden="true" />
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
