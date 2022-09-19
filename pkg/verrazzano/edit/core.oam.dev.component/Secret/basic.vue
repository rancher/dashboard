<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import SecretHelper from '@pkg/mixins/secret-helper';

export default {
  name:       'BasicAuthSecret',
  components: { LabeledInput },
  mixins:     [SecretHelper],
  props:      {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    return {
      username: '',
      password: '',
    };
  },
  methods: {
    getUsername() {
      return this.decodedData['username'] || '';
    },
    getPassword() {
      return this.decodedData['password'] || '';
    },
  },
  created() {
    if (this.username === '') {
      this.username = this.getUsername();
    }
    if (this.password === '') {
      this.password = this.getPassword();
    }
  },
  watch: {
    username() {
      this.setData('username', this.username);
    },
    password() {
      this.setData('password', this.password);
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="username" required :label="t('secret.basic.username')" :mode="mode" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="password" :label="t('secret.basic.password')" :mode="mode" type="password" />
      </div>
    </div>
  </div>
</template>
