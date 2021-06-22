<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import KeyValue from '@/components/form/KeyValue';
import RadioGroup from '@/components/form/RadioGroup';

export default {
  components: {
    CruResource, NameNsDescription, LabeledInput, LabeledSelect, Tab, Tabbed, KeyValue, RadioGroup
  },
  mixins: [CreateEditView],
  data() {
    return {
      mode:         'edit',
      tooltip:      '',
      a:            'a',
      arr:          [1, 2, 3],
      b:            'b',
      c:            'c',
      d:            42,
      e:            'e',
      f:            'f',
      g:            'g',
      h:            'h',
      i:            'i',
      n:            'n',
      m:            'm',
      x:            'x',
      cb:           false,
      ts:           false,
      v1:           'v1',
      version:      'version',
      radioOptions: [
        {
          label: 'Use standard load balancing algorithms',
          value: 'standard'
        }, {
          label: 'Use consistent hash-based load balancing for soft session affinity',
          value: 'consistent'
        }
      ]
    };
  },
  methods: {
    log() {
      console.log('click');
    }
  },

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
      <LabeledSelect
        label="Select or input a host"
        :options="['foo','bar','baz']"
        :mode="mode"
        :tooltip="tooltip"
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
          <LabeledInput
            v-model="v1"
            label="Name"
            :mode="mode"
            :tooltip="tooltip"
            :required="true"
          />
          <KeyValue
            v-model="v1"
            :mode="mode"
            :protip="true"
            :read-allowed="false"
          >
          </keyvalue>
        </Tab>
        <Tab
          name="load-balancer"
          :label="t('istio.destinationRule.loadBalancer.label')"
          :weight="3"
        >
          <RadioGroup
            v-model="radioOptions[0]"
            name="loadBalancer"
            :mode="modeOverride"
            :options="radioOptions"
          />
        </Tab>
        <Tab
          name="connection-pool"
          :label="t('istio.destinationRule.connectionPool.label')"
          :weight="2"
        >
          <div class="row">
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.placeholder')"
              />
            </div>
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.http2MaxRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http2MaxRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http2MaxRequests.placeholder')"
              />
            </div>
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.placeholder')"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.maxRetries.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRetries.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRetries.placeholder')"
              />
            </div>
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.connectTimeout.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.connectTimeout.help')"
                :placeholder="t('istio.destinationRule.connectionPool.connectTimeout.placeholder')"
              />
            </div>
            <div class="col span-4 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.maxConnections.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxConnections.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxConnections.placeholder')"
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
            <div class="col span-6 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.baseEjectionTime.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.baseEjectionTime.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.baseEjectionTime.placeholder')"
              />
            </div>
            <div class="col span-6 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.consecutiveErrors.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.consecutiveErrors.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.consecutiveErrors.placeholder')"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.interval.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.interval.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.interval.placeholder')"
              />
            </div>
            <div class="col span-6 mb-20">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.maxEjectionPercent.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.maxEjectionPercent.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.maxEjectionPercent.placeholder')"
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
