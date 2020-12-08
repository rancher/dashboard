<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import Select from '@/components/form/Select';
import SecretSelector from '@/components/form/SecretSelector';
import InputWithSelect from '@/components/form/InputWithSelect';
import ButtonGroup from '@/components/ButtonGroup';
export default {
  layout:     'unauthenticated',
  components: {
    ButtonGroup,
    LabeledInput,
    LabeledSelect,
    UnitInput,
    Select,
    SecretSelector,
    InputWithSelect
  },

  data() {
    return {
      mode:    'edit',
      tooltip: '',
      a:       'a',
      b:       'b',
      c:       'c',
      d:       42,
      e:       'e',
      f:       'f',
      g:       'g',
      h:       'h',
      i:       'i',
    };
  },
};
</script>
<template>
  <div>
    <div class="m-20">
      <ButtonGroup v-model="mode" :options="[{label: 'Edit', value: 'edit'},{label: 'View', value: 'view'}]" class="mr-20" />
      <ButtonGroup v-model="tooltip" :options="[{label: 'No Tooltip', value: ''},{label: 'Yes Tooltip', value: 'hello world'}]" />
    </div>

    <div class="m-20">
      <LabeledInput
        v-model="a"
        label="Labeled Input"
        :mode="mode"
        :tooltip="tooltip"
      />
    </div>
    <div class="m-20">
      <LabeledInput
        v-model="b"
        label="Multiline"
        type="multiline"
        :mode="mode"
        :tooltip="tooltip"
      />
    </div>
    <div class="m-20">
      <LabeledSelect
        v-model="c"
        label="Labeled Select"
        :options="['foo','bar','baz']"
        :mode="mode"
        :tooltip="tooltip"
      />
    </div>
    <div class="m-20">
      <UnitInput
        v-model="d"
        :mode="mode"
        :tooltip="tooltip"
        label="Unit Input"
        suffix="Things"
      />
    </div>
    <div class="m-20">
      <Select
        v-model="e"
        :options="['foo','bar']"
        :mode="mode"
        :tooltip="tooltip"
      />
    </div>
    <div class="m-20">
      <SecretSelector
        v-model="f"
        :mode="mode"
        namespace="default"
        :tooltip="tooltip"
        label="Secret"
        :show-key-selector="false"
      />
    </div>
    <div class="m-20">
      <SecretSelector
        v-model="g"
        :mode="mode"
        namespace="default"
        :tooltip="tooltip"
        label="Secret+Key"
        :show-key-selector="true"
      />
    </div>
    <div class="m-20">
      <InputWithSelect
        v-model="h"
        :select-before-text="false"
        :tooltip="tooltip"
        text-label="Input With Select"
        :mode="mode"
        :options="['foo','bar']"
      />
    </div>
    <div class="m-20">
      <InputWithSelect
        v-model="i"
        :select-before-text="true"
        text-label="Input With Select"
        :mode="mode"
        :tooltip="tooltip"
        :options="['foo','bar']"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
</style>
