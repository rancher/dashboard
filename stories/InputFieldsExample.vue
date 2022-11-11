<script>
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import InputWithSelect from '@shell/components/form/InputWithSelect.vue';
import Select from '@shell/components/form/Select.vue';

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
      tags:    [
        'create', 'delete', 'watch',
      ],
      moreTags: [
        'create', 'delete', 'watch', 'update', 'list', 'patch'
      ],
      verbs: [
        'create',
        'delete',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
    };
  }
};
</script>

<template>
  <form>
    <h3>Standard HTML Input field</h3>

    <div class="row">
      <div class="col span-6">
        <input v-model="inputValue">
      </div>
      <div class="col span-6">
        <input
          v-model="inputValue"
          disabled
        >
      </div>
    </div>

    <h3>LabeledInput control</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          label="Label"
          type="text"
          value="123"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          disabled
          label="Label"
          type="text"
          value="123"
        />
      </div>
    </div>

    <LabeledInput
      type="text"
      value="No label"
      class="mt-10"
    />
    <LabeledInput
      label="Label will not be shown"
      type="text"
      value="No label (compact)"
      compact
      class="mt-10"
    />
    <LabeledInput
      type="text"
      value="No label (not compact)"
      :compact="false"
      class="mt-10"
    />

    <h3>UnitInput control (with suffix)</h3>

    <div class="row">
      <div class="col span-6">
        <UnitInput
          label="Label"
          type="text"
          value="123"
          suffix="Seconds"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          label="Label"
          type="text"
          value="123"
          suffix="Seconds"
          tooltip="Tooltip for suffix"
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        <UnitInput
          disabled
          label="Label"
          type="text"
          value="123"
          suffix="Seconds"
        />
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

    <Select
      v-model="selectOption"
      :options="options"
    />

    <p>When placed in a div with the "col" class:</p>

    <div class="row">
      <div class="col span-6">
        <Select
          v-model="selectOption"
          :options="options"
        />
      </div>
      <div class="col span-6">
        <Select
          v-model="selectOption"
          :options="options"
          disabled
        />
      </div>
    </div>

    <h3>LabeledSelect control</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
          disabled
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        LabeledSelect (with label)
      </div>
      <div class="col span-6">
        LabeledSelect (without label, not compact)
      </div>
    </div>
    <div class="row mt-5">
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          :compact="false"
          :options="options"
        />
      </div>
    </div>

    <LabeledSelect
      v-model="selectOption"
      :options="options"
      class="mt-10"
    />
    <LabeledSelect
      v-model="selectOption"
      :options="options"
      compact
      class="mt-10"
    />
    <LabeledSelect
      v-model="selectOption"
      :options="options"
      :compact="false"
      class="mt-10"
    />

    <div class="row mt-10">
      <div class="col span-6">
        Select
      </div>
      <div class="col span-6">
        LabeledSelect (compact)
      </div>
    </div>
    <div class="row mt-5">
      <div class="col span-6">
        <Select
          v-model="selectOption"
          label="Select"
          :options="options"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          :options="options"
        />
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

    <h3>LabeledSelect - Taggable</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="tags"
          :taggable="true"
          :options="verbs"
          :searchable="true"
          :push-tags="true"
          :multiple="true"
          :mode="edit"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          :options="options"
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="tags"
          label="With Label (Taggable Select)"
          :taggable="true"
          :options="verbs"
          :searchable="true"
          :push-tags="true"
          :multiple="true"
          :mode="edit"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select control alongside"
          :options="options"
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        <LabeledSelect
          v-model="moreTags"
          :taggable="true"
          :options="verbs"
          :searchable="true"
          :push-tags="true"
          :multiple="true"
          :mode="edit"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="moreTags"
          label="Taggable Select"
          :taggable="true"
          :options="verbs"
          :searchable="true"
          :push-tags="true"
          :multiple="true"
          :mode="edit"
        />
      </div>
    </div>

    <h3>Fields in column layout</h3>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          label="Label"
          type="text"
          value="123"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          label="Label"
          type="text"
          value="123"
          :compact="true"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
          :compact="true"
        />
      </div>
    </div>

    <div class="row mt-10">
      <div class="col span-4">
        <LabeledInput
          label="Label"
          type="text"
          value="123"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="selectOption"
          label="Select"
          :options="options"
        />
      </div>
      <div class="col span-4">
        <InputWithSelect
          :select-before-text="false"
          :text-value="textValue"
          :select-value="select"
          text-label="Label"
          select-label="Units"
          :options="unitOptions"
        />
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
