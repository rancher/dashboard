<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { CONFIG_MAP } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ConfigMapKeySelector',
  components: {
    Checkbox,
    LabeledSelect,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
  },
  data() {
    return {
      loaded:          false,
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allConfigMaps:   {},
      configMaps:      [],
    };
  },
  async fetch() {
    const requests = { configMaps: this.$store.dispatch('management/findAll', { type: CONFIG_MAP }) };

    const hash = await allHash(requests);

    if (hash.configMaps) {
      this.sortObjectsByNamespace(hash.configMaps, this.allConfigMaps);
    }
    this.fetchInProgress = false;
  },
  computed: {
    keys() {
      const configMapName = this.getField('name');
      const keys = [];

      if (configMapName) {
        const configMap = this.configMaps.find(cm => cm.metadata?.name === configMapName);

        if (configMap && configMap.data) {
          keys.push(...Object.keys(configMap.data));
        }
      }

      return keys;
    }
  },
  methods: {
    resetConfigMaps() {
      if (!this.fetchInProgress) {
        this.configMaps = this.allConfigMaps[this.namespace] || [];
      }
    },
  },
  mounted() {
    this.loaded = true;
  },
  watch: {
    fetchInProgress() {
      this.resetConfigMaps();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetConfigMaps();
    },
    'value.name'(neu, old) {
      let resetKey = false;

      if (this.loaded && old) {
        if (neu) {
          if (neu !== old) {
            const neuSecret = this.secrets.find(secret => secret.metadata?.name === neu);
            const key = this.getField('key');

            if (key && !(key in neuSecret.data)) {
              resetKey = true;
            }
          }
        } else {
          resetKey = true;
        }
      }

      if (resetKey) {
        this.setField('key', undefined);
      }
    },
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledSelect
        :value="getField('name')"
        :mode="mode"
        :options="configMaps"
        option-label="metadata.name"
        :reduce="configMap => configMap.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.configMapKeySelector.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        :value="getField('key')"
        :mode="mode"
        :options="keys"
        :placeholder="getNotSetPlaceholder(value, 'key')"
        :label="t('verrazzano.common.fields.configMapKeySelector.key')"
        @input="setFieldIfNotEmpty('key', $event)"
      />
    </div>
    <div class="col span-4">
      <div class="spacer-small" />
      <Checkbox
        :value="getField('optional')"
        :mode="mode"
        :label="t('verrazzano.common.fields.configMapKeySelector.optional')"
        @input="setBooleanField('optional', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
