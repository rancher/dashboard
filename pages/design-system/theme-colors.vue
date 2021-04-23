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
    LabeledInput,
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
  </div>
</template>

<style lang='scss' scoped>
</style>
