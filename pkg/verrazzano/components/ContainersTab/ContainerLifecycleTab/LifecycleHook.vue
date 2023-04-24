<script>
// Added by Verrazzano
import HttpGet from '@pkg/components/HttpGet';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'LifecycleHook',
  components: {
    HttpGet,
    LabeledArrayList,
    LabeledSelect,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    const { exec = {}, httpGet = {} } = this.value;
    let type;

    if (!this.isEmptyValue(exec)) {
      type = 'exec';
    } else if (!this.isEmptyValue(httpGet)) {
      type = 'httpGet';
    } else {
      type = 'exec';
    }

    return {
      isLoading:  true,
      actionType: type,
    };
  },
  computed: {
    actionTypeOptions() {
      return [
        { value: 'exec', label: this.t('verrazzano.common.types.containerProbeAction.exec') },
        { value: 'httpGet', label: this.t('verrazzano.common.types.containerProbeAction.httpGet') },
      ];
    },
    isExecAction() {
      return this.actionType === 'exec';
    },
    isHttpGetAction() {
      return this.actionType === 'httpGet';
    },
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    actionType(neu, old) {
      if (!this.isLoading && neu !== old) {
        this.setField(old, undefined);
      }
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="actionType"
          :mode="mode"
          :options="actionTypeOptions"
          option-key="value"
          option-label="label"
          :label="t('verrazzano.common.fields.container.lifecycle.actionType')"
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
          :value-label="t('verrazzano.common.fields.container.lifecycle.command')"
          :add-label="t('verrazzano.common.buttons.addExecCommand')"
          @input="setFieldIfNotEmpty('exec.command', $event)"
        />
      </div>
      <div v-else-if="isHttpGetAction">
        <h4>{{ t('verrazzano.common.titles.containerProbe.httpGet') }}</h4>
        <HttpGet
          :value="getField('httpGet')"
          :mode="mode"
          @input="setFieldIfNotEmpty('httpGet', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
