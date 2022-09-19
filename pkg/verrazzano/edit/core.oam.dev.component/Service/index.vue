<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabelsTab from '@pkg/components/LabelsTab';
import OamComponentHelper from '@pkg/mixins/oam-component-helper';
import ServicePortsTab from '@pkg/edit/core.oam.dev.component/Service/ServicePortsTab';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';

export default {
  name:       'Service',
  components: {
    Checkbox,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    LabelsTab,
    ServicePortsTab,
    TreeTab,
    TreeTabbed,
  },
  mixins: [OamComponentHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    let { clusterIPs } = this.value;

    if (typeof clusterIPs === 'undefined') {
      clusterIPs = [];
    }

    return {
      isLoading: true,
      clusterIPs,
    };
  },
  computed: {
    isExternalNameType() {
      const result = this.getWorkloadSpecField('type');

      return result === 'ExternalName';
    },
    isNotExternalNameType() {
      return !this.isExternalNameType;
    },
    isLoadBalancerType() {
      const result = this.getWorkloadSpecField('type');

      return result === 'LoadBalancer';
    },
    isSingleStack() {
      const result = this.getWorkloadSpecField('ipFamilyPolicy');

      return typeof result === 'undefined' || result === 'SingleStack';
    },
    ipFamiliesOptions() {
      return this.isSingleStack ? this.serviceIPFamiliesSingleStackOptions : this.serviceIPFamiliesDualStackOptions;
    },
    ipFamilies() {
      const currentValue = this.getWorkloadSpecField('ipFamilies');
      let result;

      if (Array.isArray(currentValue) && currentValue.length > 0) {
        const tmp = this.ipFamiliesOptions.find(entry => this.arraysAreEquivalent(entry.realValue, currentValue));

        if (tmp) {
          result = tmp.label;
        }
      }

      return result;
    },
  },
  methods: {
    initSpec() {
      this.setField('spec', {
        workload: {
          apiVersion: this.serviceApiVersion,
          kind:       'Service',
          metadata:   { namespace: this.value.metadata.namespace },
        }
      });
    },
    setClusterIPsField(value) {
      if (Array.isArray(value) && value.length > 0) {
        this.clusterIPs = [value[0]];

        if (!this.isSingleStack && value.length > 1) {
          this.clusterIPs.push(value[1]);
        }

        this.setWorkloadSpecFieldIfNotEmpty('clusterIPs', this.clusterIPs);
      } else {
        this.clusterIPs = [];
        this.setWorkloadSpecField('clusterIPs', undefined);
      }
    },
    setIPFamilies(value) {
      let valueToSet;

      if (value) {
        const entry = this.ipFamiliesOptions.find(entry => entry.value === value);

        if (entry) {
          valueToSet = entry.realValue;
        }
      }
      this.setWorkloadSpecFieldIfNotEmpty('ipFamilies', valueToSet);
    },
  },
  created() {
    if (!this.value.spec?.workload) {
      this.initSpec();
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    'metadata.namespace'(neu, old) {
      if (neu) {
        this.setWorkloadFieldIfNotEmpty('metadata.namespace', neu);
      }
    },
    'value.spec.workload.spec.type'(neu, old) {
      if (!this.isLoading) {
        if (old === 'LoadBalancer' && neu !== 'LoadBalancer') {
          this.setWorkloadSpecBooleanField('allocateLoadBalancerNodePorts', undefined);
        }

        if (old === 'ExternalName' && neu !== 'ExternalName') {
          this.setWorkloadSpecField('externalName', undefined);
        }

        if (old !== 'ExternalName' && neu === 'ExternalName') {
          this.setWorkloadSpecField('ipFamilies', undefined);
          this.setWorkloadSpecField('ipFamilyPolicy', undefined);
        }
      }
    },
  },
};
</script>

<template>
  <TreeTabbed>
    <template #nestedTabs>
      <TreeTab name="general" :label="t('verrazzano.common.tabs.general')">
        <template #default>
          <div class="row">
            <div class="col span-4">
              <div class="spacer-small" />
              <Checkbox
                :value="getWorkloadSpecField('publishNotReadyAddresses')"
                :mode="mode"
                :label="t('verrazzano.common.fields.publishNotReadyAddresses')"
                @input="setWorkloadSpecBooleanField('publishNotReadyAddresses', $event)"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadMetadataField('name')"
                :mode="mode"
                required
                :placeholder="getWorkloadMetadataNotSetPlaceholder(value, 'name')"
                :label="t('verrazzano.common.fields.serviceName')"
                @input="setWorkloadMetadataFieldIfNotEmpty('name', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('type')"
                :mode="mode"
                :options="serviceTypeOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'type')"
                :label="t('verrazzano.common.fields.serviceType')"
                @input="setWorkloadSpecFieldIfNotEmpty('type', $event)"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('externalTrafficPolicy')"
                :mode="mode"
                :options="externalTrafficPolicyOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'externalTrafficPolicy')"
                :label="t('verrazzano.common.fields.externalTrafficPolicy')"
                @input="setWorkloadSpecFieldIfNotEmpty('externalTrafficPolicy', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('sessionAffinity')"
                :mode="mode"
                :options="sessionAffinityOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'sessionAffinity')"
                :label="t('verrazzano.common.fields.sessionAffinity')"
                @input="setWorkloadSpecFieldIfNotEmpty('sessionAffinity', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('sessionAffinityConfig.clientIP.timeoutSeconds')"
                :mode="mode"
                type="Number"
                min="1"
                max="86400"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'sessionAffinityConfig.clientIP.timeoutSeconds')"
                :label="t('verrazzano.common.fields.sessionAffinityConfig.clientIP.timeoutSeconds')"
                @input="setWorkloadSpecFieldIfNotEmpty('sessionAffinityConfig.clientIP.timeoutSeconds', $event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
      <LabelsTab
        :value="getWorkloadField('metadata')"
        :mode="mode"
        tab-name="labels"
        @input="setWorkloadFieldIfNotEmpty('metadata', $event)"
      />
      <ServicePortsTab
        :value="getWorkloadSpecListField('ports')"
        :mode="mode"
        tab-name="ports"
        @input="setWorkloadSpecFieldIfNotEmpty('ports', $event)"
      />
      <TreeTab
        v-if="isNotExternalNameType"
        name="ip"
        :label="t('verrazzano.common.tabs.ipSettings')"
      >
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                :value="getWorkloadSpecField('ipFamilyPolicy')"
                :mode="mode"
                :options="serviceIPFamilyPolicyOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'ipFamilyPolicy')"
                :label="t('verrazzano.common.fields.ipFamilyPolicy')"
                @input="setWorkloadSpecFieldIfNotEmpty('ipFamilyPolicy', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledSelect
                :value="ipFamilies"
                :mode="mode"
                :options="ipFamiliesOptions"
                option-key="value"
                option-label="label"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'ipFamilies')"
                :label="t('verrazzano.common.fields.ipFamilies')"
                @input="setIPFamilies($event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('clusterIP')"
                :mode="mode"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'clusterIP')"
                :label="t('verrazzano.common.fields.clusterIP')"
                @input="setWorkloadSpecFieldIfNotEmpty('clusterIP', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <h3>{{ t('verrazzano.common.titles.clusterIPs') }}</h3>
          <div class="row">
            <div class="col span-4">
              <LabeledArrayList
                :value="getWorkloadSpecListField('clusterIPs')"
                :mode="mode"
                :value-label="t('verrazzano.common.fields.clusterIPs')"
                :add-label="t('verrazzano.common.buttons.addClusterIP')"
                @input="setClusterIPsField($event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
      <TreeTab
        v-if="isLoadBalancerType"
        name="loadBalancer"
        :label="t('verrazzano.common.tabs.loadBalancer')"
      >
        <template #default>
          <div class="row">
            <div class="col-span-4">
              <div class="spacer-tiny" />
              <Checkbox
                :value="getWorkloadSpecField('allocateLoadBalancerNodePorts')"
                :mode="mode"
                :label="t('verrazzano.common.fields.allocateLoadBalancerNodePorts')"
                @input="setWorkloadSpecBooleanField('allocateLoadBalancerNodePorts', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('loadBalancerIP')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'loadBalancerIP')"
                :label="t('verrazzano.common.fields.loadBalancerIP')"
                @input="setWorkloadSpecNumberField('loadBalancerIP', $event)"
              />
            </div>
          </div>
          <div class="spacer-small" />
          <div class="row">
            <div class="col span-4">
              <LabeledArrayList
                :value="getWorkloadSpecListField('loadBalancerSourceRanges')"
                :mode="mode"
                :value-label="t('verrazzano.common.fields.loadBalancerSourceRange')"
                :add-label="t('verrazzano.common.buttons.addLoadBalancerSourceRange')"
                @input="setWorkloadSpecFieldIfNotEmpty('loadBalancerSourceRanges', $event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
      <TreeTab
        v-else-if="isExternalNameType"
        name="external"
        :label="t('verrazzano.common.tabs.externalName')"
      >
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getWorkloadSpecField('externalName')"
                :mode="mode"
                :placeholder="getWorkloadSpecNotSetPlaceholder(value, 'externalName')"
                :label="t('verrazzano.common.fields.externalName')"
                @input="setWorkloadSpecFieldIfNotEmpty('externalName', $event)"
              />
            </div>
            <div class="col span-4">
              <LabeledArrayList
                :value="getWorkloadSpecListField('externalIPs')"
                :mode="mode"
                :value-label="t('verrazzano.common.fields.externalIP')"
                :add-label="t('verrazzano.common.buttons.addExternalIP')"
                @input="setWorkloadSpecFieldIfNotEmpty('externalIPs', $event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
    </template>
  </TreeTabbed>
</template>

<style scoped>

</style>
