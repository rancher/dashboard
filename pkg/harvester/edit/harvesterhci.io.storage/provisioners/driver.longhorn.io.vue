<script>
import KeyValue from '@shell/components/form/KeyValue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import RadioGroup from '@components/Form/Radio/RadioGroup';

import { _CREATE, _VIEW } from '@shell/config/query-params';
import { LONGHORN } from '@shell/config/types';
import { clone } from '@shell/utils/object';
import { uniq } from '@shell/utils/array';

const DEFAULT_PARAMETERS = [
  'numberOfReplicas',
  'staleReplicaTimeout',
  'diskSelector',
  'nodeSelector',
  'migratable',
];

export default {
  components: {
    KeyValue,
    LabeledSelect,
    LabeledInput,
    RadioGroup,
  },

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

  data() {
    if (this.mode === _CREATE) {
      this.$set(this.value, 'parameters', {
        numberOfReplicas:    '3',
        staleReplicaTimeout: '30',
        diskSelector:        null,
        nodeSelector:        null,
        migratable:          'true',
      });
    }

    return {};
  },

  computed: {
    longhornNodes() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/all`](LONGHORN.NODES);
    },

    nodeTags() {
      return (this.longhornNodes || []).reduce((sum, node) => {
        const tags = node.spec?.tags || [];

        return uniq([...sum, ...tags]);
      }, []);
    },

    diskTags() {
      return (this.longhornNodes || []).reduce((sum, node) => {
        const disks = node.spec?.disks;

        const tagsOfNode = Object.keys(disks).reduce((sum, key) => {
          const tags = disks[key]?.tags;

          return uniq([...sum, ...tags]);
        }, []);

        return uniq([...sum, ...tagsOfNode]);
      }, []);
    },

    isView() {
      return this.mode === _VIEW;
    },

    migratableOptions() {
      return [{
        label: this.t('generic.yes'),
        value: 'true'
      }, {
        label: this.t('generic.no'),
        value: 'false'
      }];
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

    nodeSelector: {
      get() {
        const nodeSelector = this.value?.parameters?.nodeSelector;

        if ((nodeSelector || '').includes(',')) {
          return nodeSelector.split(',');
        } else if (nodeSelector) {
          return [nodeSelector];
        } else {
          return [];
        }
      },

      set(value) {
        this.value.parameters.nodeSelector = (value || []).join(',');
      }
    },

    diskSelector: {
      get() {
        const diskSelector = this.value?.parameters?.diskSelector;

        if ((diskSelector || '').includes(',')) {
          return diskSelector.split(',');
        } else if (diskSelector) {
          return [diskSelector];
        } else {
          return [];
        }
      },

      set(value) {
        this.value.parameters.diskSelector = (value || []).join(',');
      }
    },

    numberOfReplicas: {
      get() {
        return this.value?.parameters?.numberOfReplicas;
      },

      set(value) {
        if (value >= 1 && value <= 3) {
          this.value.parameters.numberOfReplicas = String(value);
        }
      }
    },
  },
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="numberOfReplicas"
          :label="t('harvester.storage.parameters.numberOfReplicas.label')"
          :required="true"
          :mode="mode"
          min="1"
          max="3"
          type="number"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.parameters.staleReplicaTimeout"
          :label="t('harvester.storage.parameters.staleReplicaTimeout.label')"
          :required="true"
          :mode="mode"
          type="number"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="nodeSelector"
          :label="t('harvester.storage.parameters.nodeSelector.label')"
          :options="nodeTags"
          :taggable="true"
          :multiple="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="diskSelector"
          :label="t('harvester.storage.parameters.diskSelector.label')"
          :options="diskTags"
          :taggable="true"
          :multiple="true"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.migratable"
          name="layer3NetworkMode"
          :label="t('harvester.storage.parameters.migratable.label')"
          :mode="mode"
          :options="migratableOptions"
        />
      </div>
    </div>
    <KeyValue
      v-model="parameters"
      :add-label="t('storageClass.longhorn.addLabel')"
      :read-allowed="false"
      :mode="mode"
      class="mt-10"
    />
  </div>
</template>

<style lang="scss" scoped>
.labeled-input.compact-input {
  padding: 7px 10px;
}
</style>
