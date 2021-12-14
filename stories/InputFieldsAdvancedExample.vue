<script>
import Select from '../components/form/Select.vue';
import KeyValue from '../components/form/KeyValue.vue';
import Taints from '../components/form/Taints.vue';
import Tolerations from '../components/form/Tolerations.vue';

export default {
  components: {
    KeyValue,
    Select,
    Taints,
    Tolerations,
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
      ]
    };
  }
};
</script>

<template>
  <form>
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
