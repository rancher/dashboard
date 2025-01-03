<script>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { get, set } from '@shell/utils/object';
import LoadBalancer from './LoadBalancer';

export default {
  components: {
    CruResource,
    NameNsDescription,
    LabeledInput,
    Tab,
    Tabbed,
    KeyValue,
    ArrayListGrouped,
    LoadBalancer
  },

  mixins: [CreateEditView],

  inheritAttrs: false,

  created() {
    if (!get(this.value, 'spec.trafficPolicy.loadBalancer')) {
      set(this.value, 'spec.trafficPolicy.loadBalancer', { simple: 'ROUND_ROBIN' });
    }
  },

  methods: {
    get,
    set
  }
};
</script>

<template>
  <CruResource
    :validation-passed="true"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :done-route="doneRoute"
    @finish="save"
    @error="e=>errors = e"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />
    <div class="mb-20">
      <LabeledInput
        v-model:value="value.spec.host"
        :label="t('istio.destinationRule.host.label')"
        :mode="mode"

        :required="true"
      />
    </div>

    <div class="mb-20">
      <Tabbed :side-tabs="true">
        <Tab
          name="subsets"
          :label="t('istio.destinationRule.subsets.label')"
          istio-destination-rule-subsets-label
          :weight="10"
        >
          <ArrayListGrouped
            v-model:value="value.spec.subsets"
            table-class="fixed"
            :mode="mode"
            title="Name"
            :default-add-value="{}"
          >
            <template #default="{row, i}">
              <LabeledInput
                v-model:value="row.value.name"
                :label="t('generic.name')"
                :mode="mode"
                :required="true"
              />
              <KeyValue
                :key="i"
                v-model:value="row.value.labels"
                :mode="mode"
                :protip="true"
                :read-allowed="false"
              />
            </template>
          </ArrayListGrouped>
        </Tab>
        <Tab
          name="load-balancer"
          :label="t('istio.destinationRule.loadBalancer.label')"
          :weight="3"
        >
          <LoadBalancer
            v-model:value="value.spec.trafficPolicy.loadBalancer"
            :mode="mode"
          />
        </Tab>
        <Tab
          name="connection-pool"
          :label="t('istio.destinationRule.connectionPool.label')"
          :weight="2"
        >
          <div class="row">
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value,'spec.trafficPolicy.connectionPool.http.http1MaxPendingRequests')"
                :label="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.placeholder')"
                @update:value="set(value,'spec.trafficPolicy.connectionPool.http.http1MaxPendingRequests', $event)"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.connectionPool.http.http2MaxRequests')"
                :label="t('istio.destinationRule.connectionPool.http2MaxRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http2MaxRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http2MaxRequests.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.connectionPool.http.http2MaxRequests', $event)"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.connectionPool.http.maxRequestsPerConnection')"
                :label="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.connectionPool.http.maxRequestsPerConnection', $event)"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.connectionPool.http.maxRetries')"
                :label="t('istio.destinationRule.connectionPool.maxRetries.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRetries.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRetries.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.connectionPool.http.maxRetries', $event)"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.connectionPool.tcp.duration')"
                :label="t('istio.destinationRule.connectionPool.connectTimeout.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.connectTimeout.help')"
                :placeholder="t('istio.destinationRule.connectionPool.connectTimeout.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.connectionPool.tcp.duration', $event)"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput
                :value="get(value,'spec.trafficPolicy.connectionPool.tcp.maxConnections')"
                :label="t('istio.destinationRule.connectionPool.maxConnections.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxConnections.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxConnections.placeholder')"
                @update:value="set(value,'spec.trafficPolicy.connectionPool.tcp.maxConnections', $event)"
              />
            </div>
          </div>
        </Tab>
        <Tab
          name="outlier-detection"
          :label="t('istio.destinationRule.outlierDetection.label')"
          :weight="1"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.outlierDetection.baseEjectionTime')"
                :label="t('istio.destinationRule.outlierDetection.baseEjectionTime.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.baseEjectionTime.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.baseEjectionTime.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.outlierDetection.baseEjectionTime', $event)"
              />
            </div>
            <div class="col span-6 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.outlierDetection.consecutiveErrors')"
                :label="t('istio.destinationRule.outlierDetection.consecutiveErrors.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.consecutiveErrors.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.consecutiveErrors.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.outlierDetection.consecutiveErrors', $event)"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                :value="get(value,'spec.trafficPolicy.outlierDetection.interval')"
                :label="t('istio.destinationRule.outlierDetection.interval.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.interval.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.interval.placeholder')"
                @update:value="set(value,'spec.trafficPolicy.outlierDetection.interval', $event)"
              />
            </div>
            <div class="col span-6 mb-10">
              <LabeledInput
                :value="get(value, 'spec.trafficPolicy.outlierDetection.maxEjectionPercent')"
                :label="t('istio.destinationRule.outlierDetection.maxEjectionPercent.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.maxEjectionPercent.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.maxEjectionPercent.placeholder')"
                @update:value="set(value, 'spec.trafficPolicy.outlierDetection.maxEjectionPercent', $event)"
              />
            </div>
          </div>
        </Tab>
      </Tabbed>
    </div>
  </cruresource>
</template>

<style>

</style>
