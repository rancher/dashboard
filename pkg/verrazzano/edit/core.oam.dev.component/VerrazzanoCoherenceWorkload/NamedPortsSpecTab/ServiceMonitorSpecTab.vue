<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PrometheusRelabelConfigsTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/PrometheusRelabelConfigsTab';
import PrometheusTLSConfigTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/PrometheusTLSConfigTab';
import SecretKeySelector from '@pkg/components/SecretKeySelector';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'ServiceMonitorSpecTab',
  components: {
    Checkbox,
    KeyValue,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    PrometheusRelabelConfigsTab,
    PrometheusTLSConfigTab,
    SecretKeySelector,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper],
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
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      isLoading:    true,
      authType:     'bearerTokenFile'
    };
  },
  computed: {
    authTypeOptions() {
      return [
        { value: 'basicAuth', label: this.t('verrazzano.coherence.types.authentication.basicAuth') },
        { value: 'bearerTokenFile', label: this.t('verrazzano.coherence.types.authentication.bearerTokenFile') },
        { value: 'bearerTokenSecret', label: this.t('verrazzano.coherence.types.authentication.bearerTokenSecret') },
      ];
    },
    showBasicAuth() {
      return this.authType === 'basicAuth';
    },
    showBearerTokenFile() {
      return this.authType === 'bearerTokenFile';
    },
    showBearerTokenSecret() {
      return this.authType === 'bearerTokenSecret';
    },
  },
  methods: {
    deleteAuth() {
      this.setField('basicAuth', undefined);
      this.setField('bearerTokenFile', undefined);
      this.setField('bearerTokenSecret', undefined);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.serviceMonitor');
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    authType(neu, old) {
      if (!this.isLoading && old && neu !== old) {
        this.setField(old, undefined);
      }
    }
  }
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <Checkbox
            :value="getField('enabled')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.serviceMonitor.enabled')"
            @input="setBooleanField('enabled', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('honorLabels')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.serviceMonitor.honorLabels')"
            @input="setBooleanField('honorLabels', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('honorTimestamps')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.serviceMonitor.honorTimestamps')"
            @input="setBooleanField('honorTimestamps', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('sampleLimit')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'sampleLimit')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.sampleLimit')"
            @input="setBooleanField('sampleLimit', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('interval')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'interval')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.interval')"
            @input="setFieldIfNotEmpty('interval', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('scrapeTimeout')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'scrapeTimeout')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.scrapeTimeout')"
            @input="setFieldIfNotEmpty('scrapeTimeout', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <h3>{{ t('verrazzano.coherence.titles.serviceMonitor.httpSettings') }}</h3>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('path')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'path')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.path')"
            @input="setFieldIfNotEmpty('path', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('scheme')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'scheme')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.scheme')"
            @input="setFieldIfNotEmpty('scheme', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('proxyURL')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'proxyURL')"
            :label="t('verrazzano.coherence.fields.serviceMonitor.proxyURL')"
            @input="setFieldIfNotEmpty('proxyURL', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-12">
          <KeyValue
            :value="getField('params')"
            :mode="mode"
            :title="t('verrazzano.coherence.titles.httpParams')"
            :add-label="t('verrazzano.coherence.buttons.addHttpParam')"
            :read-allowed="false"
            @input="setFieldIfNotEmpty('params', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab
        :name="createTabName(treeTabName, 'labels')"
        :label="t('verrazzano.coherence.tabs.labels')"
      >
        <template #default>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                :value="getField('jobLabel')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'jobLabel')"
                :label="t('verrazzano.coherence.fields.serviceMonitor.jobLabel')"
                @input="setFieldIfNotEmpty('jobLabel', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <div class="row">
            <div class="col span-12">
              <KeyValue
                :value="getField('labels')"
                :mode="mode"
                :title="t('verrazzano.coherence.titles.serviceMonitor.labels')"
                :add-label="t('verrazzano.coherence.buttons.serviceMonitor.addLabel')"
                :read-allowed="false"
                @input="setFieldIfNotEmpty('labels', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <div class="row">
            <div class="col span-6">
              <h3>{{ t('verrazzano.coherence.titles.serviceMonitor.targetLabels') }}</h3>
              <LabeledArrayList
                :value="getListField('targetLabels')"
                :mode="mode"
                :value-label="t('verrazzano.coherence.fields.serviceMonitor.targetLabel')"
                :add-label="t('verrazzano.coherence.buttons.addTargetLabel')"
                @input="setFieldIfNotEmpty('targetLabels', $event)"
              />
            </div>
            <div class="col span-6">
              <h3>{{ t('verrazzano.coherence.titles.serviceMonitor.podTargetLabels') }}</h3>
              <LabeledArrayList
                :value="getListField('podTargetLabels')"
                :mode="mode"
                :value-label="t('verrazzano.coherence.fields.serviceMonitor.podTargetLabel')"
                :add-label="t('verrazzano.coherence.buttons.addPodTargetLabel')"
                @input="setFieldIfNotEmpty('podTargetLabels', $event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
      <PrometheusTLSConfigTab
        :value="getField('tlsConfig')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'tls')"
        @input="setFieldIfNotEmpty('tlsConfig', $event)"
        @delete="setField('tlsConfig', undefined)"
      />
      <TreeTab :name="createTabName(treeTabName, 'auth')" :label="t('verrazzano.coherence.titles.serviceMonitor.authentication')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.titles.serviceMonitor.authentication')"
            :mode="mode"
            @click="deleteAuth()"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-4">
              <LabeledSelect
                v-model="authType"
                :mode="mode"
                :options="authTypeOptions"
                option-key="value"
                option-label="label"
                :label="t('verrazzano.coherence.fields.serviceMonitor.authType')"
              />
            </div>
            <div v-if="showBearerTokenFile" class="col span-4">
              <LabeledInput
                :value="getField('bearerTokenFile')"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(value, 'bearerTokenFile')"
                :label="t('verrazzano.coherence.fields.namedPort.bearerTokenFile')"
                @input="setFieldIfNotEmpty('bearerTokenFile', $event)"
              />
            </div>
          </div>
          <div class="spacer" />
          <div v-if="showBearerTokenSecret">
            <div>
              <h3>{{ t('verrazzano.coherence.titles.serviceMonitor.bearerTokenSecret') }}</h3>
              <SecretKeySelector
                :value="getField('bearerTokenSecret')"
                :mode="mode"
                :namespaced-object="namespacedObject"
                @input="setFieldIfNotEmpty('bearerTokenSecret', $event)"
              />
            </div>
          </div>
          <div v-else-if="showBasicAuth">
            <h3>{{ t('verrazzano.coherence.titles.basicAuth.username') }}</h3>
            <SecretKeySelector
              :value="getField('username')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('username', $event)"
            />
            <div class="spacer-small" />
            <h3>{{ t('verrazzano.coherence.titles.basicAuth.password') }}</h3>
            <SecretKeySelector
              :value="getField('password')"
              :mode="mode"
              :namespaced-object="namespacedObject"
              @input="setFieldIfNotEmpty('password', $event)"
            />
          </div>
        </template>
      </TreeTab>
      <PrometheusRelabelConfigsTab
        :value="getListField('relabelings')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'relabelings')"
        :tab-label="t('verrazzano.coherence.tabs.relabelings')"
        @input="setFieldIfNotEmpty('relabelings', $event)"
      />
      <PrometheusRelabelConfigsTab
        :value="getListField('metricsRelabelings')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'metricsRelabelings')"
        :tab-label="t('verrazzano.coherence.tabs.metricsRelabelings')"
        @input="setFieldIfNotEmpty('metricsRelabelings', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
