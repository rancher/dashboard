<script>
import { TYPES } from '@/models/secret';
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import Mount from '@/edit/workload/storage/Mount';
export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Mount,
  },

  props:      {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    },

    // namespaced secrets
    secrets: {
      type:    Array,
      default: () => []
    },

    // namespaced configMaps
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
    type() {
      return this.value._type;
    },

    certificates() {
      return this.secrets.filter(secret => secret._type === TYPES.TLS).reduce((total, secret) => {
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

    defaultMode: {
      get() {
        const isconfigMap = this.type === 'configMap';

        if (isconfigMap) {
          const oct = this.value?.configMap?.defaultMode;

          return oct ? oct.toString(8) : null;
        } else {
          const oct = this.value?.secret?.defaultMode;

          return oct ? oct.toString(8) : null;
        }
      },
      set(neu) {
        const isconfigMap = !!this.value.configMap;

        if (isconfigMap) {
          this.$set(this.value.configMap, 'defaultMode', parseInt(neu, 8));
        } else {
          this.$set(this.value.secret, 'defaultMode', parseInt(neu, 8));
        }
      },
    },

    optional: {
      get() {
        return this.type === 'configMap' ? this.value.configMap.optional : this.value.secret.optional;
      },
      set(neu) {
        if (this.type === 'configMap') {
          this.$set(this.value.configMap, 'optional', neu);
        } else {
          this.$set(this.value.secret, 'optional', neu);
        }
      }
    },

    ...mapGetters({ t: 'i18n/t' })
  },

};
</script>

<template>
  <div>
    <button v-if="mode!=='view'" type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
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
          <LabeledInput v-model="defaultMode" :mode="mode" :label="t('workload.storage.defaultMode')" />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect v-if="type==='certificate'" v-model="value.secret.secretName" :options="certificates" :mode="mode" :label="t('workload.storage.certificate')" />
          <LabeledSelect v-else-if="type==='secret'" v-model="value[type].secretName" :options="secretNames" :mode="mode" :label="t('workload.storage.subtypes.secret')" />
          <LabeledSelect v-else-if="type==='configMap'" v-model="value[type].name" :options="configMapNames" :mode="mode" :label="t('workload.storage.subtypes.configMap')" />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model="optional"
            :mode="mode"
            name="optional"
            :row="true"
            :label="t('workload.storage.optional.label')"
            :options="[true, false]"
            :labels="[t('workload.storage.optional.yes'), t('workload.storage.optional.no')]"
          />
        </div>
      </div>
    </div>
    <Mount :pod-spec="podSpec" :name="value.name" :mode="mode" />
  </div>
</template>
