<script>
import ArrayList from '@/components/form/ArrayList';
import { NAME as HARVESTER } from '@/config/product/harvester';
import Row from './Row';

export const TYPES = [
  {
    key:      'configMaps',
    units:    'unitless',
    labelKey: 'resourceQuota.configMaps'
  },
  {
    key:      'limitsCpu',
    units:    'cpu',
    labelKey: 'resourceQuota.limitsCpu'
  },
  {
    key:      'limitsMemory',
    units:    'memory',
    labelKey: 'resourceQuota.limitsMemory'
  },
  {
    key:      'persistentVolumeClaims',
    units:    'unitless',
    labelKey: 'resourceQuota.persistentVolumeClaims'
  },
  {
    key:      'pods',
    units:    'unitless',
    labelKey: 'resourceQuota.pods'
  },
  {
    key:      'replicationControllers',
    units:    'unitless',
    labelKey: 'resourceQuota.replicationControllers'
  },
  {
    key:      'requestsCpu',
    units:    'cpu',
    labelKey: 'resourceQuota.requestsCpu'
  },
  {
    key:      'requestsMemory',
    units:    'memory',
    labelKey: 'resourceQuota.requestsMemory'
  },
  {
    key:      'requestsStorage',
    units:    'storage',
    labelKey: 'resourceQuota.requestsStorage'
  },
  {
    key:      'secrets',
    units:    'unitless',
    labelKey: 'resourceQuota.secrets'
  },
  {
    key:      'services',
    units:    'unitless',
    labelKey: 'resourceQuota.services'
  },
  {
    key:      'servicesLoadBalancers',
    units:    'unitless',
    labelKey: 'resourceQuota.servicesLoadBalancers'
  },
  {
    key:      'servicesNodePorts',
    units:    'unitless',
    labelKey: 'resourceQuota.servicesNodePorts'
  },
];

const HARVESTER_TYPES = [
  {
    key:      'configMaps',
    units:    'unitless',
    labelKey: 'harvester.cloudTemplate.label'
  },
  {
    key:      'limitsCpu',
    units:    'cpu',
    labelKey: 'resourceQuota.limitsCpu'
  },
  {
    key:      'limitsMemory',
    units:    'memory',
    labelKey: 'resourceQuota.limitsMemory'
  },
  {
    key:      'requestsCpu',
    units:    'cpu',
    labelKey: 'resourceQuota.requestsCpu'
  },
  {
    key:      'requestsMemory',
    units:    'memory',
    labelKey: 'resourceQuota.requestsMemory'
  },
];

export default {
  components: { ArrayList, Row },

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
    }
  },

  data() {
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'namespaceDefaultResourceQuota', this.value.spec.namespaceDefaultResourceQuota || { limit: {} });
    this.$set(this.value.spec, 'resourceQuota', this.value.spec.resourceQuota || { limit: {} });

    return { types: Object.keys(this.value.spec.resourceQuota.limit) };
  },

  computed: {
    mappedTypes() {
      return (this.isHarvester ? HARVESTER_TYPES : TYPES)
        .map(type => ({
          label: this.t(type.labelKey),
          units: type.units,
          value: type.key
        }));
    },

    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
  },

  methods: {
    updateType(i, type) {
      this.$set(this.types, i, type);
    },
    remainingTypes(currentType) {
      return this.mappedTypes
        .filter(type => !this.types.includes(type.value) || type.value === currentType);
    }
  },
};
</script>
<template>
  <ArrayList
    v-model="types"
    label="Resources"
    :add-label="t('resourceQuota.add.label')"
    :default-add-value="remainingTypes()[0] ? remainingTypes()[0].value : ''"
    :add-allowed="remainingTypes().length > 0"
    :mode="mode"
  >
    <template #columns="props">
      <Row v-model="value" :mode="mode" :types="remainingTypes(types[props.i])" :type="types[props.i]" @type-change="updateType(props.i, $event)" />
    </template>
  </ArrayList>
</template>
<style lang="scss" scoped>
.row {
  .headers {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: calc(100% - 75px);

    span {
      width: 100%;
    }
  }
}
</style>
