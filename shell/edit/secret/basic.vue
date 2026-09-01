<script>
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import { useFormRules } from '@shell/composables/useFormValidation';
import { useI18n } from '@shell/composables/useI18n';

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

  setup() {
    const store = useStore();
    const { t } = useI18n(store);
    const { getRules } = useFormRules(
      t,
      [
        {
          path:           'username',
          rules:          ['required'],
          translationKey: 'secret.basic.username',
        },
        {
          path:           'password',
          rules:          ['required'],
          translationKey: 'secret.basic.password',
        },
      ]
    );

    return { getRules };
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
          v-model:value="username"
          name="username"
          required
          :label="t('secret.basic.username')"
          :mode="mode"
          :rules="getRules('username')"
          data-testid="secret-basic-username"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="password"
          name="password"
          required
          :label="t('secret.basic.password')"
          :mode="mode"
          type="password"
          :rules="getRules('password')"
          data-testid="secret-basic-password"
        />
      </div>
    </div>
  </div>
</template>
