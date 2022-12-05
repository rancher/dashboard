<script>
import KeyValue from '@shell/components/form/KeyValue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { getPSALabels } from '@shell/utils/pod-security-admission';

export default {
  components: {
    ToggleSwitch,
    KeyValue
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    return { toggler: true };
  },
  computed: {
    /**
     * Generate list of present keys which can be filtered based on existing label keys and system keys
     */
    protectedKeys() {
      return getPSALabels(this.value);
    },
  }
};
</script>
<template>
  <div class="labels">
    <div class="labels__header">
      <h2>
        <t k="labels.labels.title" />
      </h2>
      <ToggleSwitch
        v-model="toggler"
        name="label-system-toggle"
        :on-label="t('labels.labels.show')"
      />
    </div>
    <p class="helper-text mt-20 mb-20">
      <t k="labels.labels.description" />
    </p>
    <KeyValue
      key="labels"
      :value="value.labels"
      :protected-keys="protectedKeys"
      :toggle-filter="toggler"
      :add-label="t('labels.addLabel')"
      :mode="mode"
      :read-allowed="false"
      :value-can-be-empty="true"
      @input="value.setLabels($event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.labels {
  &__header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1em;
  }
}
</style>
