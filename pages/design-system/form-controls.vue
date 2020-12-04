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
      mode: 'edit',
      a:    'a',
      b:    'b',
      c:    'c',
      d:    42,
      e:    'e',
      f:    'f',
      g:    'g',
      h:    'h',
      i:    'i',
    };
  },
};
</script>
<template>
  <div>
    <div class="m-20">
      <ButtonGroup v-model="mode" :options="['edit','view']" />
    </div>

    <div class="m-20">
      <LabeledInput
        v-model="a"
        label="Labeled Input"
        :mode="mode"
      />
    </div>
    <div class="m-20">
      <LabeledInput
        v-model="b"
        label="Multiline"
        type="multiline"
        :mode="mode"
      />
    </div>
    <div class="m-20">
      <LabeledSelect
        v-model="c"
        label="Labeled Select"
        :options="['foo','bar','baz']"
        :mode="mode"
      />
    </div>
    <div class="m-20">
      <UnitInput
        v-model="d"
        :mode="mode"
        label="Unit Input"
        suffix="Things"
      />
    </div>
    <div class="m-20">
      <Select
        v-model="e"
        :options="['foo','bar']"
        :mode="mode"
      />
    </div>
    <div class="m-20">
      <SecretSelector
        v-model="f"
        :mode="mode"
        label="Secret"
        :show-key-selector="false"
      />
    </div>
    <div class="m-20">
      <SecretSelector
        v-model="g"
        :mode="mode"
        label="Secret+Key"
        :show-key-selector="true"
      />
    </div>
    <div class="m-20">
      <InputWithSelect
        v-model="h"
        :select-before-text="false"
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
        :options="['foo','bar']"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
</style>
