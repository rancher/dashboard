<script>
import CreateEditView from '@/mixins/create-edit-view';
import SecretSelector from '@/components/form/SecretSelector';
import { SECRET } from '@/config/types';
import { TYPES } from '@/models/secret';

export default {
  components: { SecretSelector },

  mixins: [CreateEditView],

  props: {},

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    return {
      secret: {
        secret_name: '',
        key:         ''
      },
      secret2: {
        name:        '',
        special_key:         ''
      },
      secret3: {
        name: '',
        key:  ''
      },
      name:  '',
      types: [TYPES.OPAQUE]
    };
  },
};
</script>

<template>
  <div class="cluster-output">
    <div class="row">
      <div class="col span-6">
        <div class="ml-20 mb-50">
          <SecretSelector v-model="name" label="Just secret name" />
          <pre>{{ name }}</pre>
        </div>

        <div class="ml-20 mb-50">
          <SecretSelector v-model="secret" label="Key selector with custom name" :show-key-selector="true" name-key="secret_name" />
          <pre>{{ secret }}</pre>
        </div>

        <div class="ml-20 mb-50">
          <SecretSelector v-model="secret2" label="Key selector with custom key" :show-key-selector="true" key-key="special_key" />
          <pre>{{ secret2 }}</pre>
        </div>

        <div class="ml-20 mb-50">
          <SecretSelector v-model="secret3" label="Filtered secrets" :show-key-selector="true" :types="types" />
          <pre>{{ secret3 }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  pre {
    background-color:var(--nav-bg);
    padding: 10px;
    border-radius: var(--border-radius);

  }
</style>
