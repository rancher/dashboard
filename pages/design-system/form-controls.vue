<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import Select from '@/components/form/Select';
import SecretSelector from '@/components/form/SecretSelector';
import InputWithSelect from '@/components/form/InputWithSelect';
import Checkbox from '@/components/form/Checkbox';
import ButtonGroup from '@/components/ButtonGroup';
import { mapPref, THEME } from '@/store/prefs';
import { ucFirst } from '@/utils/string';

export default {
  layout:     'unauthenticated',
  components: {
    ButtonGroup,
    Checkbox,
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
      n:       'n',
      m:       'm',
      x:       'x',
      cb:      false,
    };
  },

  computed: {
    theme: mapPref(THEME),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          label: ucFirst(value),
          value
        };
      });
    },
  }
};
</script>
<template>
  <div>
    <div class="m-20">
      <ButtonGroup v-model="mode" :options="[{label: 'Edit', value: 'edit'},{label: 'View', value: 'view'}]" class="mr-20" />
      <ButtonGroup v-model="tooltip" :options="[{label: 'No Tooltip', value: ''},{label: 'Yes Tooltip', value: 'hello world'}]" class="mr-20" />
      <ButtonGroup v-model="theme" :options="themeOptions" />
    </div>

    <div class="m-20">
      <LabeledInput
        v-model="a"
        label="Labeled Input"
        :mode="mode"
        :tooltip="tooltip"
      />
    </div>
    <div class="row m-20">
      <div class="col span-4">
        <LabeledInput
          v-model="x"
          label="Labeled Input"
          :mode="mode"
          :tooltip="tooltip"
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
    <div class="m-20">
      <InputWithSelect
        v-model="i"
        select-label="a"
        :select-before-text="true"
        text-label="Input With Select"
        :mode="mode"
        :tooltip="tooltip"
        :options="['foo','bar']"
      />
    </div>
    <div class="m-20">
      <InputWithSelect
        v-model="i"
        :select-before-text="true"
        :mode="mode"
        :tooltip="tooltip"
        :options="['foo','bar']"
      />
    </div>
    <div class="m-20">
      <Checkbox
        v-model="cb"
        label="Test checkbox (toggle-able)"
        :mode="mode"
      />
      <Checkbox
        :value="false"
        label="Test checkbox (not checked)"
        :mode="mode"
      />
      <Checkbox
        :value="true"
        label="Test checkbox (checked)"
        :mode="mode"
      />
      <Checkbox
        :value="false"
        label="Test checkbox (disabled)"
        :disabled="true"
        :mode="mode"
      />
      <Checkbox
        :value="true"
        label="Test checkbox (disabled, checked)"
        :disabled="true"
        :mode="mode"
      />
      <Checkbox
        :value="true"
        label="Test checkbox with tooltip"
        :disabled="false"
        :mode="mode"
        tooltip="Test tooltip for checkbox"
      />
    </div>
    <div class="m-20">
      <Checkbox
        v-model="cb"
        label="Test checkbox (indeterminate)"
        :mode="mode"
        :indeterminate="true"
      />
      <Checkbox
        :value="false"
        label="Test checkbox (indeterminate, not checked)"
        :mode="mode"
        :indeterminate="true"
      />
      <Checkbox
        :value="true"
        label="Test checkbox (indeterminate, checked)"
        :mode="mode"
        :indeterminate="true"
      />
      <Checkbox
        :value="false"
        label="Test checkbox (indeterminate, not checked, disabled)"
        :mode="mode"
        :disabled="true"
        :indeterminate="true"
      />
      <Checkbox
        :value="true"
        label="Test checkbox (indeterminate, checked, disabled)"
        :mode="mode"
        :disabled="true"
        :indeterminate="true"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
</style>
