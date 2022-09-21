<script>
import Select from '@shell/components/form/Select.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Taints from '@shell/components/form/Taints.vue';
import Tolerations from '@shell/components/form/Tolerations.vue';
import Upgrading from '@shell/edit/workload/Upgrading.vue';
import Security from '@shell/components/form/Security.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Security,
    Select,
    Taints,
    Tolerations,
    Upgrading,
  },
  data() {
    return {
      value:   '',
      options: [
        { id: '1', label: 'Option One' },
        { id: '2', label: 'Option Two' },
      ],
      mode:         'EDIT',
      textValue:    '100',
      inputValue:   'Simple text',
      selectOption: 'Option Two',
      select:       'GB',
      unitOptions:  [
        { id: '1', label: 'MB' },
        { id: '2', label: 'GB' },
      ],
      labels: {
        key1: 'value1',
        key2: 'value2\nmulti-line\ntext area',
      },
      columns: ['extra'],
      taints:  [
        { key: 'Key' }
      ],
      tolerations: [
        { key: 'Toleration 1' }
      ],
      upgrading: {
        type:     'RollingUpdate',
        template: { spec: { terminationGracePeriodSeconds: 30 } }
      },
      securityContext: {},
      x:               'Example',
    };
  }
};
</script>

<template>
  <form>
    <h3>Alignment</h3>

    <div class="row" style="background: tomato;">
      <div class="col span-4">
        <LabeledInput
          v-model="x"
          label="Labeled Input"
          :mode="mode"
          :tooltip="tooltip"
          status="success"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="x"
          label="Multiline"
          type="multiline"
          :mode="mode"
          :tooltip="tooltip"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="x"
          label="Labeled Select"
          :options="['foo','bar','baz']"
          :mode="mode"
          :tooltip="tooltip"
        />
      </div>
    </div>

    <h3>KeyValue control</h3>

    <KeyValue v-model="labels" />

    <KeyValue v-model="labels" :extra-columns="['effect']">
      <template #label:effect>
        Units
      </template>

      <template #col:effect="{row}">
        <Select
          v-model="row.effect"
          :options="options"
          class="compact-select"
        />
      </template>
    </KeyValue>

    <h3>Taints control</h3>
    <Taints v-model="taints" mode="edit" />

    <h3>Tolerations control</h3>
    <Tolerations v-model="tolerations" mode="edit" />

    <h3>Upgrade control</h3>
    <Upgrading v-model="upgrading" mode="edit" />

    <h3>Security Context control</h3>
    <Security v-model="securityContext" mode="edit" />
  </form>
</template>

<style scoped>
  h3 {
    margin-top: 20px;
  }

  p {
    margin: 10px 0;
  }
</style>
