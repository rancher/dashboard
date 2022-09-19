<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import HttpGet from '@pkg/components/HttpGet';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ProbeTcpSocket from '@pkg/components/ContainerProbeTab/ProbeTcpSocket';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'ProbeTab',
  components: {
    HttpGet,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    ProbeTcpSocket,
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
      type:     String,
      default: 'create'
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
      httpGet = {},
      tcpSocket = {}
    } = this.value;
    let type;

    if (!this.isEmptyValue(exec)) {
      type = 'exec';
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
      ];
    },
    isExecAction() {
      return this.actionType === 'exec';
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
      const actionFields = ['exec', 'httpGet', 'tcpSocket'];
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
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            v-model="actionType"
            :mode="mode"
            :options="actionTypeOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.common.fields.containerProbe.actionType')"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('timeoutSeconds')"
            :mode="mode"
            type="Number"
            min="1"
            :placeholder="getNotSetPlaceholder(value, 'timeoutSeconds')"
            :label="t('verrazzano.coherence.fields.probeTimeoutSeconds')"
            @input="setNumberField('timeoutSeconds', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <div v-if="isExecAction">
          <h3>{{ t('verrazzano.common.titles.containerProbe.execCommands') }}</h3>
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
          <h3>{{ t('verrazzano.common.titles.httpGet') }}</h3>
          <HttpGet
            :value="getField('httpGet')"
            :mode="mode"
            @input="setFieldIfNotEmpty('httpGet', $event)"
          />
        </div>
        <div v-else-if="isTcpSocketAction">
          <h3>{{ t('verrazzano.common.titles.containerProbe.tcpSocket') }}</h3>
          <ProbeTcpSocket
            :value="getField('tcpSocket')"
            :mode="mode"
            @input="setFieldIfNotEmpty('tcpSocket', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
