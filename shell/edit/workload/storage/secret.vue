<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
  },

  props: {
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
    loading: {
      default: false,
      type:    Boolean
    },
  },

  computed: {
    type() {
      if (this.value._type) {
        return this.value._type;
      }
      if (!!this.value.secret) {
        return 'secret';
      }

      return 'configMap';
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
        let oct;

        if (isconfigMap) {
          oct = this.value?.configMap?.defaultMode;
        } else {
          oct = this.value?.secret?.defaultMode;
        }

        if (typeof oct === 'number') {
          const parsed = oct.toString(8);

          return !isNaN(parsed) ? parsed : null;
        }

        return null;
      },
      set(neu) {
        const isconfigMap = !!this.value.configMap;
        const dec = parseInt(neu, 8);

        if (isconfigMap) {
          this.value.configMap['defaultMode'] = dec;
        } else {
          this.value.secret['defaultMode'] = dec;
        }
      },
    },

    optional: {
      get() {
        return this.type === 'configMap' ? this.value.configMap.optional : this.value.secret.optional;
      },
      set(neu) {
        if (this.type === 'configMap') {
          this.value.configMap['optional'] = neu;
        } else {
          this.value.secret['optional'] = neu;
        }
      }
    },

    ...mapGetters({ t: 'i18n/t' })
  },

};
</script>

<template>
  <div>
    <div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.name"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.volumeName')"
          />
        </div>

        <div class="col span-6">
          <LabeledInput
            v-model:value="defaultMode"
            :mode="mode"
            :label="t('workload.storage.defaultMode')"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-if="type==='secret'"
            v-model:value="value[type].secretName"
            :options="secretNames"
            :mode="mode"
            :required="true"
            :label="t('workload.storage.subtypes.secret')"
            :loading="loading"
          />
          <LabeledSelect
            v-else-if="type==='configMap'"
            v-model:value="value[type].name"
            :options="configMapNames"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.subtypes.configMap')"
            :loading="loading"
          />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model:value="optional"
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
  </div>
</template>
