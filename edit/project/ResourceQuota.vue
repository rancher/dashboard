<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import { _EDIT } from '@/config/query-params';

export const RESOURCE_MAPPING = {
  limitsCpu: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.cpuLimit',
    projectLimitPlaceholderNumber: 2000,
    inputExponent:                 -1,
    suffixKey:                     'suffix.cpus',
    defaultLimitPlaceholderNumber: 500
  },
  requestsCpu: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.cpuReservation',
    projectLimitPlaceholderNumber: 2000,
    inputExponent:                 -1,
    suffixKey:                     'suffix.cpus',
    defaultLimitPlaceholderNumber: 500
  },
  limitsMemory: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.memoryLimit',
    projectLimitPlaceholderNumber: 2048,
    inputExponent:                 2,
    suffixKey:                     'suffix.ib',
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.1024',
    defaultLimitPlaceholderNumber: 1024
  },
  requestsMemory: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.memoryReservation',
    projectLimitPlaceholderNumber: 2048,
    inputExponent:                 2,
    suffixKey:                     'suffix.ib',
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.1024',
    defaultLimitPlaceholderNumber: 1024
  },
  requestsStorage: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.storageReservation',
    projectLimitPlaceholderNumber: 50,
    inputExponent:                 3,
    suffixKey:                     'suffix.ib',
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  servicesLoadBalancers: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.servicesLoadBalancers',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  servicesNodePorts: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.servicesNodePorts',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  pods: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.pods',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  services: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.services',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  configMaps: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.configMaps',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  persistentVolumeClaims: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.persistentVolumeClaims',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  replicationControllers: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.replicationControllers',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  },
  secrets: {
    labelKey:                      'projectPage.tabs.resourceQuota.options.secrets',
    projectLimitPlaceholderNumber: 50,
    defaultLimitPlaceholderKey:    'projectPage.tabs.resourceQuota.placeholders.10',
    defaultLimitPlaceholderNumber: 10
  }
};

export default {
  name: 'ResourceQuota',

  components: { LabeledSelect, UnitInput },

  props: {
    mode: {
      type:     String,
      required: true
    },

    value: {
      type:     Object,
      required: true
    },

    selection: {
      type:     Array,
      default: () => []
    }
  },

  data() {
    const availableResourceOptions = this.computeAvailableResourceOptions();

    return { quota: availableResourceOptions[0] };
  },

  computed: {
    isEdit() {
      return this.mode === _EDIT;
    },
    mapping() {
      const resource = this.value.resource;

      return RESOURCE_MAPPING[resource];
    },
    projectLimitPlaceholder() {
      const number = this.mapping?.projectLimitPlaceholderNumber;

      if (number) {
        return this.t('projectPage.tabs.resourceQuota.numberPlaceholder', { number });
      }

      return '';
    },

    defaultLimitPlaceholder() {
      const number = this.mapping?.defaultLimitPlaceholderNumber;

      if (number) {
        return this.t('projectPage.tabs.resourceQuota.numberPlaceholder', { number });
      }

      return '';
    },

    suffix() {
      const suffixKey = this.mapping?.suffixKey;

      if (suffixKey) {
        return this.t(suffixKey);
      }

      return '';
    },

    inputExponent() {
      return this.mapping?.inputExponent || 0;
    },

    availableResourceOptions() {
      return this.computeAvailableResourceOptions();
    }
  },

  created() {
    if (!this.value.resource) {
      const availableResourceOptions = this.computeAvailableResourceOptions();

      this.value.resource = availableResourceOptions[0].value;
    }
  },

  methods: {
    computeResourceOptions() {
      return Object.entries(RESOURCE_MAPPING).map((mappingEntry) => {
        return {
          value: mappingEntry[0],
          label: this.t(mappingEntry[1].labelKey)
        };
      });
    },
    computeAvailableResourceOptions() {
      const resourceOptions = this.computeResourceOptions();
      const selectedResourceNames = this.selection.map(s => s.resource);
      const selectedOption = resourceOptions.find(option => option.value === this.value.resource);
      const filteredOptions = resourceOptions.filter(option => option === selectedOption || !selectedResourceNames.includes(option.value));

      return filteredOptions;
    }
  },
};
</script>
<template>
  <div class="resource-quota-list row mt-10">
    <div class="col" :class="{'span-5': isEdit, 'span-3': !isEdit}">
      <LabeledSelect v-model="value.resource" :mode="mode" :options="availableResourceOptions" :clearable="false" />
    </div>
    <div class="col span-3">
      <UnitInput
        v-model="value.projectLimit"
        :suffix="suffix"
        :input-exponent="inputExponent"
        :mode="mode"
        :placeholder="projectLimitPlaceholder"
      />
    </div>
    <div class="col span-3">
      <UnitInput
        v-model="value.defaultLimit"
        :suffix="suffix"
        :input-exponent="inputExponent"
        :mode="mode"
        :placeholder="defaultLimitPlaceholder"
      />
    </div>
    <div class="col span-1">
      <button v-if="isEdit" class="btn btn-sm role-link col mt-10" @click="$emit('remove')">
        {{ t('projectPage.tabs.resourceQuota.remove') }}
      </button>
    </div>
  </div>
</template>
