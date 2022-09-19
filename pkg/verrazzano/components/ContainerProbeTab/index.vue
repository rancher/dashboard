<script>
// Added by Verrazzano
import HttpGet from '@pkg/components/HttpGet';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ProbeGrpc from '@pkg/components/ContainerProbeTab/ProbeGrpc';
import ProbeTcpSocket from '@pkg/components/ContainerProbeTab/ProbeTcpSocket';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainerProbeTab',
  components: {
    HttpGet,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    ProbeGrpc,
    ProbeTcpSocket,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      default: 'create'
    },
    isReadinessProbe: {
      type:    Boolean,
      default: false
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:     String,
      required: true,
    },
  },
  data() {
    const {
      exec = {},
      grpc = {},
      httpGet = {},
      tcpSocket = {}
    } = this.value;
    let type;

    if (!this.isEmptyValue(exec)) {
      type = 'exec';
    } else if (!this.isEmptyValue(grpc)) {
      type = 'grpc';
    } else if (!this.isEmptyValue(httpGet)) {
      type = 'httpGet';
    } else if (!this.isEmptyValue(tcpSocket)) {
      type = 'tcpSocket';
    } else {
      type = 'exec';
    }

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      isLoading:    true,
      actionType:   type
    };
  },
  computed: {
    actionTypeOptions() {
      return [
        { value: 'exec', label: this.t('verrazzano.common.types.containerProbeAction.exec') },
        { value: 'httpGet', label: this.t('verrazzano.common.types.containerProbeAction.httpGet') },
        { value: 'tcpSocket', label: this.t('verrazzano.common.types.containerProbeAction.tcpSocket') },
        { value: 'grpc', label: this.t('verrazzano.common.types.containerProbeAction.grpc') },
      ];
    },
    isExecAction() {
      return this.actionType === 'exec';
    },
    isGrpcAction() {
      return this.actionType === 'grpc';
    },
    isHttpGetAction() {
      return this.actionType === 'httpGet';
    },
    isTcpSocketAction() {
      return this.actionType === 'tcpSocket';
    },
  },
  methods: {
    clearUnusedActions() {
      const actionFields = ['exec', 'grpc', 'httpGet', 'tcpSocket'];
      const index = actionFields.indexOf(this.actionType);

      if (index !== -1) {
        actionFields.splice(index, 1);
      }

      actionFields.forEach((actionField) => {
        this.setField(actionField, undefined);
      });
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    actionType(neu, old) {
      if (!this.isLoading && neu !== old) {
        this.clearUnusedActions();
      }
    }
  },
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
      <div>
        <div class="row">
          <div class="col span-3">
            <LabeledSelect
              v-model="actionType"
              :mode="mode"
              :options="actionTypeOptions"
              option-key="value"
              option-label="label"
              :label="t('verrazzano.common.fields.containerProbe.actionType')"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('initialDelaySeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :label="t('verrazzano.common.fields.containerProbe.initialDelaySeconds')"
              @input="setNumberField('initialDelaySeconds', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('periodSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :label="t('verrazzano.common.fields.containerProbe.periodSeconds')"
              @input="setNumberField('periodSeconds', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('timeoutSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :label="t('verrazzano.common.fields.containerProbe.timeoutSeconds')"
              @input="setNumberField('timeoutSeconds', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('failureThreshold')"
              :mode="mode"
              type="Number"
              min="1"
              :label="t('verrazzano.common.fields.containerProbe.failureThreshold')"
              @input="setNumberField('failureThreshold', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('successThreshold')"
              :mode="mode"
              type="Number"
              min="1"
              :disabled="!isReadinessProbe"
              :label="t('verrazzano.common.fields.containerProbe.successThreshold')"
              @input="setNumberField('successThreshold', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('terminationGracePeriodSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :label="t('verrazzano.common.fields.containerProbe.terminationGracePeriodSeconds')"
              @input="setNumberField('terminationGracePeriodSeconds', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div>
          <div v-if="isExecAction">
            <h4>{{ t('verrazzano.common.titles.containerProbe.execCommands') }}</h4>
            <LabeledArrayList
              :value="getListField('exec.command')"
              :mode="mode"
              :value-label="t('verrazzano.common.fields.containerProbe.command')"
              :add-label="t('verrazzano.common.buttons.addExecCommand')"
              initial-empty-row
              @input="setFieldIfNotEmpty('exec.command', $event)"
            />
          </div>
          <div v-else-if="isHttpGetAction">
            <h4>{{ t('verrazzano.common.titles.httpGet') }}</h4>
            <HttpGet
              :value="getField('httpGet')"
              :mode="mode"
              @input="setFieldIfNotEmpty('httpGet', $event)"
            />
          </div>
          <div v-else-if="isGrpcAction">
            <h4>{{ t('verrazzano.common.titles.containerProbe.grpc') }}</h4>
            <ProbeGrpc
              :value="getField('grpc')"
              :mode="mode"
              @input="setFieldIfNotEmpty('grpc', $event)"
            />
          </div>
          <div v-else-if="isTcpSocketAction">
            <h4>{{ t('verrazzano.common.titles.containerProbe.tcpSocket') }}</h4>
            <ProbeTcpSocket
              :value="getField('tcpSocket')"
              :mode="mode"
              @input="setFieldIfNotEmpty('tcpSocket', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
