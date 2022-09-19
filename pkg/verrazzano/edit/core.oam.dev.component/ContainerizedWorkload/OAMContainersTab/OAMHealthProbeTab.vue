<script>
// Added by Verrazzano
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import OAMHttpGet from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload/OAMContainersTab/OAMHttpGet';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'OAMHealthProbeTab',
  components: {
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    OAMHttpGet,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [ContainerizedWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:     String,
      required: true
    },
  },
  data() {
    const { httpGet = {}, tcpSocket = {} } = this.value;
    let instructionType;

    if (httpGet.path) {
      instructionType = 'httpGet';
    } else if (typeof tcpSocket.port !== 'undefined') {
      instructionType = 'tcpSocket';
    } else {
      instructionType = 'exec';
    }

    return {
      loading:      true,
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      instructionType,
    };
  },
  computed: {
    instructionTypeOptions() {
      return [
        { value: 'exec', label: this.t('verrazzano.common.types.probeInstructionType.exec') },
        { value: 'httpGet', label: this.t('verrazzano.common.types.probeInstructionType.httpGet') },
        { value: 'tcpSocket', label: this.t('verrazzano.common.types.probeInstructionType.tcpSocket') },
      ];
    },
    showExec() {
      return this.instructionType === 'exec';
    },
    showHttpGet() {
      return this.instructionType === 'httpGet';
    },
    showTcpSocket() {
      return this.instructionType === 'tcpSocket';
    }
  },
  mounted() {
    this.loading = false;
  },
  watch: {
    instructionType(neu, old) {
      if (!this.loading && neu && old && neu !== old) {
        this.setField(old, undefined);
      }
    },
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
          <div class="col span-4">
            <LabeledInput
              :value="getField('initialDelaySeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'initialDelaySeconds')"
              :label="t('verrazzano.common.fields.containerProbe.initialDelaySeconds')"
              @input="setNumberField('initialDelaySeconds', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('periodSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'periodSeconds')"
              :label="t('verrazzano.common.fields.containerProbe.periodSeconds')"
              @input="setNumberField('periodSeconds', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('timeoutSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'timeoutSeconds')"
              :label="t('verrazzano.common.fields.containerProbe.timeoutSeconds')"
              @input="setNumberField('timeoutSeconds', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledSelect
              v-model="instructionType"
              :mode="mode"
              required
              :options="instructionTypeOptions"
              option-key="value"
              option-label="label"
              :label="t('verrazzano.common.fields.containerProbe.instructionType')"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('failureThreshold')"
              :mode="mode"
              type="Number"
              min="1"
              :placeholder="getNotSetPlaceholder(value, 'failureThreshold')"
              :label="t('verrazzano.common.fields.containerProbe.failureThreshold')"
              @input="setNumberField('failureThreshold', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('successThreshold')"
              :mode="mode"
              type="Number"
              min="1"
              :placeholder="getNotSetPlaceholder(value, 'successThreshold')"
              :label="t('verrazzano.common.fields.containerProbe.successThreshold')"
              @input="setNumberField('successThreshold', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <div>
          <div v-if="showExec">
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
          <div v-else-if="showHttpGet">
            <h3>{{ t('verrazzano.common.titles.containerProbe.httpGet') }}</h3>
            <OAMHttpGet
              :value="getField('httpGet')"
              :mode="mode"
              @input="setFieldIfNotEmpty('httpGet', $event)"
            />
          </div>
          <div v-else-if="showTcpSocket">
            <h3>{{ t('verrazzano.common.titles.containerProbe.tcpSocket') }}</h3>
            <div class="row">
              <div class="col span-4">
                <LabeledInput
                  :value="getField('tcpSocket.port')"
                  :mode="mode"
                  type="Number"
                  min="1"
                  :placeholder="getNotSetPlaceholder(value, 'tcpSocket.port')"
                  :label="t('verrazzano.common.fields.containerProbe.successThreshold')"
                  @input="setNumberField('successThreshold', $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
