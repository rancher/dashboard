<script>
import LabeledInput from '../components/form/LabeledInput.vue';
import UnitInput from '../components/form/UnitInput.vue';
import LabeledSelect from '../components/form/LabeledSelect.vue';
import InputWithSelect from '../components/form/InputWithSelect.vue';
import Select from '../components/form/Select.vue';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    UnitInput,
    InputWithSelect,
    Select,
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
    };
  }
};
</script>

<template>
  <form>
    <h3>Standard HTML Input field</h3>

    <div class="row">
      <div class="col span-6">
        <input v-model="inputValue" />
      </div>
      <div class="col span-6">
        <input v-model="inputValue" disabled />
      </div>
    </div>

    <h3>LabeledInput control</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledInput label="Label" type="text" value="123" />
      </div>
      <div class="col span-6">
        <LabeledInput disabled label="Label" type="text" value="123" />
      </div>
    </div>

    <h3>UnitInput control (with suffix)</h3>

    <div class="row">
      <div class="col span-6">
        <UnitInput label="Label" type="text" value="123" suffix="Seconds" />
      </div>
      <div class="col span-6">
        <UnitInput label="Label" type="text" value="123" suffix="Seconds" tooltip="Tooltip for suffix" />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        <UnitInput disabled label="Label" type="text" value="123" suffix="Seconds" />
      </div>
      <div class="col span-6">
        <UnitInput
          disabled
          label="Label"
          type="text"
          value="123"
          suffix="Seconds"
          tooltip="Tooltip for suffix"
        />
      </div>
    </div>

    <h3>Select control</h3>

    <Select v-model="selectOption" :options="options" />

    <p>When placed in a div with the "col" class:</p>

    <div class="row">
      <div class="col span-6">
        <Select v-model="selectOption" :options="options" />
      </div>
      <div class="col span-6">
        <Select v-model="selectOption" :options="options" disabled />
      </div>
    </div>

    <h3>LabeledSelect control</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledSelect v-model="selectOption" label="Select" :options="options" />
      </div>
      <div class="col span-6">
        <LabeledSelect v-model="selectOption" label="Select" :options="options" disabled />
      </div>
    </div>

    <h3>InputWithSelect control</h3>

    <div class="row">
      <div class="col span-6">
        <InputWithSelect
          :text-value="textValue"
          :select-value="select"
          text-label="Label"
          select-label="Units"
          :options="unitOptions"
        />
      </div>
      <div class="col span-6">
        <InputWithSelect
          :text-value="textValue"
          :select-value="select"
          text-label="Label"
          select-label="Units"
          :options="unitOptions"
          disabled
        />
      </div>
    </div>

    <h3>InputWithSelect control (Select after input)</h3>

    <div class="row">
      <div class="col span-6">
        <InputWithSelect
          :select-before-text="false"
          :text-value="textValue"
          :select-value="select"
          text-label="Label"
          select-label="Units"
          :options="unitOptions"
        />
      </div>
      <div class="col span-6">
        <InputWithSelect
          disabled
          :select-before-text="false"
          :text-value="textValue"
          :select-value="select"
          text-label="Label"
          select-label="Units"
          :options="unitOptions"
        />
      </div>
    </div>

    <h3>Fields in column layout)</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledInput label="Label" type="text" value="123" />
      </div>
      <div class="col span-6">
        <LabeledSelect v-model="selectOption" label="Select" :options="options" />
      </div>
    </div>
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
