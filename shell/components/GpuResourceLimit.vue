<template>
  <div>
    <div class="row mt-20">
      <div class="col span-6">
        <div class="mb-10">
          <p class="helper-text">
            <t k="gpuReservation.label"></t>
          </p>
        </div>
        <div class="mb-10">
          <RadioGroup
            v-model="gpuReservationMode"
            name="gpuReservationMode"
            :options="modeOptions"
            :labels="modeLabels"
          />
        </div>
        <template v-if="gpuReservationMode === 'shared'">
          <div>
            <UnitInput
              v-model="gpuShared"
              :suffix="t('gpuReservation.memUnit')"
              :placeholder="t('gpuReservation.placeholder')"
              :label="t('gpuReservation.shared')"
              min="1"
              :mode="mode"
              @input="updateGpuShared"
            />
            <Banner color="warning" :label="t('gpuReservation.sharedTips')" />
          </div>
        </template>
        <template v-else-if="gpuReservationMode === 'set'">
          <div>
            <UnitInput
              v-model="gpuSet"
              :suffix="t('gpuReservation.unit')"
              :placeholder="t('gpuReservation.placeholder')"
              :label="t('gpuReservation.set')"
              :mode="mode"
              min="1"
              @input="updateGpuSet"
            />
          </div>
        </template>
        <template v-else-if="gpuReservationMode === 'device'">
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                v-model="gpuDevice.name"
                :label="t('gpuReservation.resourceName')"
                :mode="mode"
                :options="gpuResourceNames"
                @change="updateGpuDevice('name', $event)"
              />
            </div>
            <div class="col span-6">
              <UnitInput
                v-model="gpuDevice.value"
                :suffix="t('gpuReservation.unit')"
                :placeholder="t('gpuReservation.placeholder')"
                :label="t('gpuReservation.set')"
                :mode="mode"
                min="1"
                @input="updateGpuDevice('value', $event)"
              />
            </div>
          </div>
        </template>
      </div>
      <div v-if="showVgpu" class="col span-6">
        <div class="mb-10">
          <p class="helper-text">
            <t k="vGpuReservation.label"></t>
          </p>
        </div>
        <UnitInput
          v-model="vGpus"
          :suffix="t('vGpuReservation.unit')"
          :placeholder="t('vGpuReservation.placeholder')"
          :label="t('vGpuReservation.set')"
          :mode="mode"
          min="1"
          @input="updateVgpus"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import UnitInput from '@shell/components/form/UnitInput';
import { Banner } from '@components/Banner';
import { _VIEW } from '@shell/config/query-params';
import { mapFeature, VIRTAITECH_GPU_SERVICE_UI } from '@shell/store/features';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },
  data() {
    const {
      limitsGpuShared, limitsGpu, limitsVgpu, requestsGpuShared, requestsGpu, limitGpuDevice, requestGpuDevice
    } = this.value;

    let gpuReservationMode = 'set';
    let gpuShared = null;
    let gpuSet = null;
    const gpuDevice = { ...limitGpuDevice };

    if (limitsGpuShared && requestsGpuShared) {
      gpuReservationMode = 'shared';
      gpuShared = requestsGpuShared;
    } else if (limitsGpu && requestsGpu) {
      gpuReservationMode = 'set';
      gpuSet = requestsGpu;
    } else if (limitGpuDevice.name && requestGpuDevice.name) {
      gpuReservationMode = 'device';
    }

    return {
      gpuReservationMode,
      gpuReservationModeOptions: [
        {
          label: this.t('gpuReservation.shared'),
          value: 'shared',
        },
        {
          label: this.t('gpuReservation.set'),
          value: 'set',
        },
        {
          label: this.t('gpuReservation.devices'),
          value: 'device',
        }
      ],
      gpuShared,
      gpuSet,
      gpuDevice,
      vGpus: limitsVgpu,
    };
  },
  computed: {
    ...mapGetters(['currentCluster']),
    isView() {
      return this.mode === _VIEW;
    },
    showVgpu: mapFeature(VIRTAITECH_GPU_SERVICE_UI),
    modeOptions() {
      return this.gpuReservationModeOptions.reduce((t, c) => {
        t.push(c.value);

        return t;
      }, []);
    },
    modeLabels() {
      return this.gpuReservationModeOptions.reduce((t, c) => {
        t.push(c.label);

        return t;
      }, []);
    },
    gpuResourceNames() {
      const deviceList = this.currentCluster?.metadata?.annotations?.['gpu.pandaria.io/devicelist']?.split(',')?.filter(item => item?.trim()) ?? [];

      return deviceList.map(d => ({
        label: d,
        value: d
      }));
    }
  },
  methods: {
    updateGpuShared(v) {
      this.$emit('input', {
        limitsGpu:         null,
        requestsGpu:       null,
        limitGpuDevice:    { name: this.gpuDevice.name },
        requestGpuDevice:  { name: this.gpuDevice.name },
        limitsGpuShared:   v,
        requestsGpuShared: v,
      });
    },
    updateGpuSet(v) {
      this.$emit('input', {
        limitGpuDevice:    { name: this.gpuDevice.name },
        requestGpuDevice:  { name: this.gpuDevice.name },
        limitsGpuShared:   null,
        requestsGpuShared: null,
        limitsGpu:         v,
        requestsGpu:       v,
      });
    },
    updateGpuDevice(k, v) {
      this.$emit('input', {
        limitsGpu:         null,
        requestsGpu:       null,
        limitsGpuShared:   null,
        requestsGpuShared: null,
        limitGpuDevice:    {
          ...this.gpuDevice,
          [k]: v,
        },
        requestGpuDevice: {
          ...this.gpuDevice,
          [k]: v,
        },
      });
    },
    updateVgpus(v) {
      this.$emit('input', { limitsVgpu: v });
    }
  },
  watch: {
    gpuReservationMode(m) {
      if (m === 'shared') {
        this.updateGpuShared(this.gpuShared);
      } else if (m === 'set') {
        this.updateGpuSet(this.gpuSet);
      } else if (m === 'device') {
        this.$emit('input', {
          limitsGpu:         null,
          requestsGpu:       null,
          limitsGpuShared:   null,
          requestsGpuShared: null,
          limitGpuDevice:    { ...this.gpuDevice },
          requestGpuDevice:  { ...this.gpuDevice },
        });
      }
    }
  },
  components: {
    RadioGroup,
    UnitInput,
    Banner,
    LabeledSelect,
  }
};
</script>
<style scoped>
</style>
