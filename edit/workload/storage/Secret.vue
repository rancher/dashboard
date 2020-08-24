<script>
import { TLS } from '@/models/secret';
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import Mount from '@/edit/workload/storage/Mount';
import VolumeMount from '@/edit/workload/storage/volume-mount.js';
export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Mount,
  },

  mixins: [VolumeMount],

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    // namespaced secrets
    secrets: {
      type:    Array,
      default: () => []
    },

    // namespaced configmaps
    configMaps: {
      type:    Array,
      default: () => []
    },

    // secretVolumeSource
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

  },

  computed: {
    certificates() {
      return this.secrets.filter(secret => secret._type === TLS).reduce((total, secret) => {
        total.push(secret?.metadata?.name);

        return total;
      }, []);
    },

    secretNames() {
      return this.secrets.reduce((names, secret) => {
        names.push(secret?.metadata?.name);

        return names;
      }, []);
    },
    configMapNames() {
      return this.configMaps.reduce((names, map) => {
        names.push(map?.metadata?.name);

        return names;
      }, []);
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  created() {
    if (!this.value.defaultMode) {
      this.$set(this.value, 'defaultMode', '0644');
    }
  },

};
</script>

<template>
  <div>
    <button type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
      <i class="icon icon-2x icon-x" />
    </button>
    <div class="bordered-section">
      <h3 v-if="value._type==='certificate'">
        {{ t('workload.storage.certificate') }}
      </h3>
      <h3 v-else>
        {{ t(`workload.storage.subtypes.${type}`) }}
      </h3>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.name" :required="true" :mode="mode" :label="t('workload.storage.volumeName')" @input="e=>updateMountNames(e)" />
        </div>

        <div class="col span-6">
          <LabeledInput v-model="value[type].defaultMode" :mode="mode" :label="t('workload.storage.defaultMode')" />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect v-if="value._type==='certificate'" v-model="value[type].secretName" :options="certificates" :mode="mode" :label="t('workload.storage.certificate')" />
          <LabeledSelect v-else-if="type==='secret'" v-model="value[type].secretName" :options="secretNames" :mode="mode" :label="t('workload.storage.subtypes.secret')" />
          <LabeledSelect v-else-if="type==='configMap'" v-model="value[type].name" :options="configMapNames" :mode="mode" :label="t('workload.storage.subtypes.configMap')" />
        </div>
        <div class="col span-6">
          <RadioGroup v-model="value[type].optional" :row="true" :label="t('workload.storage.optional.label')" :options="[true, false]" :labels="[t('workload.storage.optional.yes'), t('workload.storage.optional.no')]" />
        </div>
      </div>
    </div>
    <Mount v-model="volumeMounts" :name="value.name" :mode="mode" />
  </div>
</template>
