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

    <LabeledInput
      :label="foo"
      mode="edit"
    />

    <LabeledSelect
      :label="foo"
      mode="edit"
    />

    <TextAreaAutoGrow
      v-if="valueMultiline"
      ref="value"
      :placeholder="placeholder here"
      mode="edit"
      @paste="onPaste(idx, $event)"
      @input="queueUpdate"
    />

    <input
      v-else
      ref="value"
      :placeholder="placeholder here"
      :disabled="isView"
      @paste="onPaste(idx, $event)"
      @input="queueUpdate"
    />

    <UnitInput
      mode="view"
      :value="string"
      :label="foo"
      :suffix="selected"
    />

    <Select
      :options="['foo','bar']"
      mode="edit"
      @input="e=>updateEffect(e, rule)"
    />

    <SecretSelector
      mode="edit"
      :disabled="disabled"
      :label="foo"
      :show-key-selector="true"
    />

    <InputWithSelect
      :text-value="maxSurge"
      :select-before-text="false"
      :select-value="surgeUnits"
      :text-label="foo"
      mode="edit"
      type="number"
      :options="['foo','bar']"
      @input="e=>updateWithUnits(e, 'maxSurge')"
    />
  </div>
</template>

<style lang='scss' scoped>
</style>
