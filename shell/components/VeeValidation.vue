<script lang="ts">
import Vue from 'vue';
import ErrorMessage from '@components/ErrorMessage/ErrorMessage.vue';
import { ValidationProvider } from 'vee-validate';

interface Data {}

export default Vue.extend<Data, any, any, any>({
  components: { ErrorMessage, ValidationProvider },
  props:      {
    rules: {
      type:     [String, Object],
      required: true,
    },
    showError: {
      type:    Boolean,
      default: false,
    },
    errorType: {
      type:    String,
      default: 'banner',
    },
  },
  computed: {
    veeTokenRules() {
      if (typeof this.rules === 'object') {
        return { [this.rules.rules]: { message: this.t(`validation.${ this.rules.rules }`, { key: this.t(this.rules.translationKey) }, true) } };
      }

      return this.rules;
    },
    fieldName() {
      return this.rules.id;
    }
  },
});
</script>
<template>
  <!-- vee-validate component -->
  <ValidationProvider
    v-slot="v"
    :name="fieldName"
    slim
    :rules="veeTokenRules"
    class="validation"
  >
    <!-- Field to validate-->
    <slot :veeTokenValidationContext="v" />

    <!-- Error messages -->
    <div v-if="showError">
      <ErrorMessage
        v-if="errorType === 'banner'"
        :errors="v.errors"
      />

      <span
        v-else-if="errorType === 'text'"
        class="text"
      >
        {{ v.errors.join(', ') }}
      </span>

      <i
        v-else-if="errorType === 'icon'"
        class="icon icon-warning"
      />
    </div>
  </ValidationProvider>
</template>

<style lang="scss" scoped>
// TODO remove
.validation {
  .text {
    color: red;
  }
}
</style>
