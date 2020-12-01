<script>
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'basic_auth', this.value.basic_auth || {});

    return {};
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>Auth</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.basic_auth.username" :mode="mode" label="Username" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.basic_auth.password" :mode="mode" label="Password" type="password" autocomplete="password" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.basic_auth.bearer_token" :mode="mode" label="Bearer Token" />
      </div>
    </div>
  </div>
</template>
