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
import ArrayListGrouped from '@/components/form/ArrayListGrouped';

export default {
  components: {
    CruResource, NameNsDescription, LabeledInput, LabeledSelect, Tab, Tabbed, KeyValue, RadioGroup, ArrayListGrouped,
  },
  mixins: [CreateEditView],
  data() {
    return {

      useSimple: true,

      simpleOptions: ['ROUND_ROBIN', 'LEAST_CONN', 'RANDOM', 'PASSTHROUGH'],

      hashMode: 'useHeader',

      hashOptions: [
        {
          label: 'Hash based on specific HTTP header',
          value: 'useHeader'
        },
        {
          label: 'Hash based on HTTP cookie',
          value: 'useCookie'
        },
        {
          label: 'Hash based on the source IP address',
          value: 'useIp'
        }
      ],

      radioOptions: [
        {
          label: 'Use standard load balancing algorithms',
          value: true
        }, {
          label: 'Use consistent hash-based load balancing for soft session affinity',
          value: false
        },

      ]
    };
  },
  watch: {
    useSimple(neu, old) {
      if (neu === true) {
        this.value.spec.trafficPolicy.loadBalancer.simple = 'ROUND_ROBIN';
        delete this.value.spec.trafficPolicy.loadBalancer.consistentHash;
      } else {
        delete this.value.spec.trafficPolicy.loadBalancer.simple;
        this.value.spec.trafficPolicy.loadBalancer.consistentHash = {};
      }
    },

  },
  methods: {
    updateHashMode(neu) {
      if (neu === 'useCookie') {
        delete this.value.spec.trafficPolicy.loadBalancer.consistentHash.httpHeaderName;
        this.$set(
          this.value.spec.trafficPolicy.loadBalancer.consistentHash,
          'httpCookie',
          {
            name: '',
            path: '',
            ttl:  ''

          }
        );
      }

      // if (neu === 'httpCookie') {
      //   delete this.value.spec.trafficPolicy.loadBalancer.consistentHash.httpHeaderName;
      //   this.value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie = {};
      // }

      // if (neu === 'httpCookie') {
      //   delete this.value.spec.trafficPolicy.loadBalancer.consistentHash.httpHeaderName;
      //   this.value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie = {};
      // }
      this.hashMode = neu;
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
      <LabeledInput
        v-model="value.spec.host"
        label="Input a host"
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
            v-model="value.spec.subsets"
            table-class="fixed"
            :mode="mode"
            title="Name"
            :default-add-value="{}"
          >
            <template #default="{row, i}">
              <code>i: {{ i }}, {{ JSON.stringify(row) }}</code>
              <br><br>
              <LabeledInput
                v-model="row.value.name"
                label="Name"
                :mode="mode"
                :tooltip="tooltip"
                :required="true"
              />
              <KeyValue
                :key="i"
                v-model="row.value.labels"
                :mode="mode"
                :protip="true"
                :read-allowed="false"
              >
              </keyvalue>
            </template>
          </ArrayListGrouped>
        </Tab>
        <Tab
          name="load-balancer"
          :label="t('istio.destinationRule.loadBalancer.label')"
          :weight="3"
        >
          <RadioGroup
            v-model="useSimple"
            name="loadBalancer"
            :mode="mode"
            :options="radioOptions"
          />
          <div>
            <div v-if="useSimple">
              <LabeledSelect

                v-model="value.spec.trafficPolicy.loadBalancer.simple"
                :options="simpleOptions"
                label="Algorithm"
                :mode="mode"
              >
              </LabeledSelect>
            </div>

            <div v-else class="mt-20">
              <RadioGroup
                :value="hashMode"
                name="Hash Options"
                :mode="mode"
                :options="hashOptions"
                label="Hash Mode"
                @input="updateHashMode"
              />

              <div v-if="hashMode === 'useCookie'">
                <LabeledInput
                  :value="value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie.name"
                  label="Name"
                  @input="e => $set(value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie, 'name', e)"
                >
                </LabeledInput>
                <LabeledInput
                  :value="value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie.path"
                  label="Path"
                  @input="e => $set(value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie, 'path', e)"
                >
                </LabeledInput>
                <LabeledInput
                  :value="value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie.ttl"
                  label="TTL"
                  @input="e => $set(value.spec.trafficPolicy.loadBalancer.consistentHash.httpCookie, 'ttl', e)"
                >
                </LabeledInput>
              </div>

              <div v-if="hashMode === 'useHeader'">
                <LabeledInput>
                </LabeledInput>
                <LabeledInput>
                </LabeledInput>
                <LabeledInput>
                </LabeledInput>
              </div>

              <div v-if="hashMode === 'useIp'">
                <LabeledInput>
                </LabeledInput>
                <LabeledInput>
                </LabeledInput>
                <LabeledInput>
                </LabeledInput>
              </div>
            </div>
          </div>
        </Tab>
        <Tab
          name="connection-pool"
          :label="t('istio.destinationRule.connectionPool.label')"
          :weight="2"
        >
          <div class="row">
            <div class="col span-4 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http1MaxPendingRequests.placeholder')"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.http2MaxRequests.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.http2MaxRequests.help')"
                :placeholder="t('istio.destinationRule.connectionPool.http2MaxRequests.placeholder')"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRequestsPerConnection.placeholder')"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-4 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.maxRetries.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.maxRetries.help')"
                :placeholder="t('istio.destinationRule.connectionPool.maxRetries.placeholder')"
              />
            </div>
            <div class="col span-4 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.connectionPool.connectTimeout.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.connectionPool.connectTimeout.help')"
                :placeholder="t('istio.destinationRule.connectionPool.connectTimeout.placeholder')"
              />
            </div>
            <div class="col span-4 mb-10">
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
            <div class="col span-6 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.baseEjectionTime.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.baseEjectionTime.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.baseEjectionTime.placeholder')"
              />
            </div>
            <div class="col span-6 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.consecutiveErrors.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.consecutiveErrors.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.consecutiveErrors.placeholder')"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput

                :label="t('istio.destinationRule.outlierDetection.interval.label')"
                :mode="mode"
                :tooltip="t('istio.destinationRule.outlierDetection.interval.help')"
                :placeholder="t('istio.destinationRule.outlierDetection.interval.placeholder')"
              />
            </div>
            <div class="col span-6 mb-10">
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
