<script>
import { mapGetters } from 'vuex';
import semver from 'semver';

import { LabeledInput } from '@components/Form/LabeledInput';
import Banner from '@components/Banner/Banner.vue';
import KeyValue from '@shell/components/form/KeyValue';

import { clone } from '@shell/utils/object';
import { allHash } from '@shell/utils/promise';

const DEFAULT_PARAMETERS = [
  'hostStorageClass',
];

export default {
  components: {
    LabeledInput,
    Banner,
    KeyValue,
  },

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },

  async fetch() {
    const res = await allHash({ rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }) });

    this.rke2Versions = res.rke2Versions;
  },

  data() {
    return { rke2Versions: {} };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    isSatisfiesVersion() {
      const kubernetesVersion = this.currentCluster.kubernetesVersion || '';
      const kubernetesVersionExtension = this.currentCluster.kubernetesVersionExtension;

      if (kubernetesVersionExtension.startsWith('+rke2')) {
        const charts = ((this.rke2Versions?.data || []).find((v) => v.id === kubernetesVersion) || {}).charts;
        let csiVersion = charts?.['harvester-csi-driver']?.version || '';

        if (csiVersion.endsWith('00')) {
          csiVersion = csiVersion.slice(0, -2);
        }

        return semver.satisfies(csiVersion, '>=0.1.15');
      } else {
        return true;
      }
    },

    parameters: {
      get() {
        const parameters = clone(this.value?.parameters) || {};

        DEFAULT_PARAMETERS.map((key) => {
          delete parameters[key];
        });

        return parameters;
      },

      set(value) {
        Object.assign(this.value.parameters, value);
      }
    },
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="!isSatisfiesVersion"
      color="warning"
    >
      {{ t('storageClass.harvesterhci.warning.unSatisfiesVersion', null, true) }}
    </Banner>
    <div v-else>
      <div
        class="row mb-10"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.parameters.hostStorageClass"
            :label="t('storageClass.harvesterhci.hostStorageClass.label')"
            :placeholder="t('storageClass.harvesterhci.hostStorageClass.placeholder')"
            :mode="mode"
            :tooltip="t('storageClass.harvesterhci.hostStorageClass.tooltip')"
          />
        </div>
      </div>
      <KeyValue
        v-model:value="parameters"
        :add-label="t('storageClass.longhorn.addLabel')"
        :read-allowed="false"
        :mode="mode"
      />
    </div>
  </div>
</template>
