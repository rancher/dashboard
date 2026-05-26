<script lang="ts">
import { RcSection } from '@components/RcSection';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import UnitInput from '@shell/components/form/UnitInput';
import { Checkbox } from '@components/Form/Checkbox';
import { VOLUME_TYPE_OPTIONS } from './constants';

export default {
  components: {
    RcSection, ArrayList, LabeledSelect, LabeledInput, UnitInput, Checkbox,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    rootVolumeTypeOptions: {
      type:    Array,
      default: () => [],
    },

    mode: {
      type:    String,
      default: 'create',
    },

    disabled: {
      type:    Boolean,
      default: false,
    },
  },
  computed: {
    additionalVolumeTypeOptions() {
      return VOLUME_TYPE_OPTIONS;
    },
  }
};
</script>

<template>
  <RcSection
    :title="t('capa.machineConfig.storage.title')"
    :expandable="true"
    mode="with-header"
    type="primary"
  >
    <p>{{ t('capa.machineConfig.storage.description') }}</p>

    <div class="row">
      <UnitInput
        v-model:value="value.rootVolume.size"
        label-key="capa.machineConfig.storage.rootVolume.size.label"
        suffix="GiB"
        class="mr-10"
      />
      <LabeledSelect
        v-model:value="value.rootVolume.type"
        :options="rootVolumeTypeOptions"
        label-key="capa.machineConfig.storage.rootVolume.type.label"
        required
      />
    </div>

    <Checkbox
      v-model:value="value.rootVolume.encrypted"
      :label="t('capa.machineConfig.storage.rootVolume.encrypted.label')"
    />
    <LabeledInput
      v-if="value.rootVolume.encrypted"
      v-model:value="value.rootVolume.encryptionKey"
      label-key="capa.machineConfig.storage.rootVolume.encryptionKey.label"
      placeholder-key="capa.machineConfig.storage.rootVolume.encryptionKey.placeholder"
      required
    />

    <RcSection
      :title="t('capa.machineConfig.storage.advanced.title')"
      :expandable="true"
      mode="with-header"
      type="secondary"
    >
      <ArrayList
        v-model:value="value.nonRootVolumes"
        :add-allowed="true"
        :default-add-value="{ deviceName: '', type: 'gp3', size: null }"
        :add-label="t('capa.machineConfig.storage.advanced.additionalVolumes.add')"
        :show-header="true"
        class="mb-10 additional-volumes-list"
      >
        <template #columns="{ row, queueUpdate }">
          <div class="additional-volumes-grid">
            <LabeledInput
              v-model:value="row.value.deviceName"
              label-key="capa.machineConfig.storage.advanced.additionalVolumes.deviceName.label"
              class="additional-volume-field"
              @update:value="queueUpdate"
            />
            <LabeledSelect
              v-model:value="row.value.type"
              :options="additionalVolumeTypeOptions"
              label-key="capa.machineConfig.storage.advanced.additionalVolumes.type.label"
              class="additional-volume-field"
              @update:value="queueUpdate"
            />
            <UnitInput
              v-model:value="row.value.size"
              label-key="capa.machineConfig.storage.advanced.additionalVolumes.size.label"
              class="additional-volume-field"
              suffix="GiB"
              @update:value="queueUpdate"
            />
          </div>
        </template>
      </ArrayList>
    </RcSection>
  </RcSection>
</template>

<style lang="scss" scoped>
.additional-volumes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.additional-volume-field {
  min-width: 0;
}

@media (max-width: 1024px) {
  .additional-volumes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
