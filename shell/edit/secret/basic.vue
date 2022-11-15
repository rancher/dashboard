<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const username = this.value.decodedData.username || '';
    const password = this.value.decodedData.password || '';

    return {
      username,
      password,
    };
  },

  watch: {
    username: 'update',
    password: 'update',
  },

  methods: {
    update() {
      this.value.setData('username', this.username);
      this.value.setData('password', this.password);
    }
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="username"
          required
          :label="t('secret.basic.username')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="password"
          :label="t('secret.basic.password')"
          :mode="mode"
          type="password"
        />
      </div>
    </div>
  </div>
</template>
