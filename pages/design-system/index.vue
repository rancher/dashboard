<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import UnitInput from '@/components/form/UnitInput';
import Select from '@/components/form/Select';
import SecretSelector from '@/components/form/SecretSelector';
import InputWithSelect from '@/components/form/InputWithSelect';

export default {
  layout:     'unauthenticated',
  components: {
    LabeledInput, LabeledSelect, TextAreaAutoGrow, UnitInput, Select, SecretSelector, InputWithSelect
  },
};
</script>

<template>
  <div>
    <h1>Design System</h1>
    <section>
      <h2>Page Examples</h2>
      <nav>
        <nuxt-link to="design-system/page-examples/list" class="btn role-tertiary">
          list
        </nuxt-link>
        <nuxt-link to="design-system/page-examples/create" class="btn role-tertiary">
          create
        </nuxt-link>
        <nuxt-link to="design-system/page-examples/detail" class="btn role-tertiary">
          detail
        </nuxt-link>
      </nav>
    </section>
  </div>
</template>

<style lang='scss' scoped>
</style>
