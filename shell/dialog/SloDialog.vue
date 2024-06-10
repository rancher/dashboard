<script>
import { Card } from '@components/Card';

export default {
  components: { Card },

  props: {
    authProvider: {
      type:     Object,
      required: true
    }
  },

  computed: {
    name() {
      return this.authProvider?.nameDisplay;
    }
  },

  methods: {
    async doLogout(logoutAll = false) {
      const options = { force: true, provider: this.authProvider };

      // Single Sign Logout for SAML
      if (logoutAll) {
        options.slo = true;
        options.provider = this.authProvider;
      }

      this.$emit('close');

      await this.$store.dispatch('auth/logout', options, { root: true });
    },
  }
};
</script>

<template>
  <Card
    class="prompt-remove"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text"
    >
      {{ t('promptSlo.title', { name }) }}
    </h4>
    <div
      slot="body"
      class="pl-10 pr-10 mt-20 mb-20"
    >
      {{ t('promptSlo.text', { name }) }}
    </div>
    <template #actions>
      <div class="btn-block">
        <button
          class="btn role-secondary mr-10"
          @click="doLogout()"
        >
          {{ t('promptSlo.rancher') }}
        </button>
        <div class="spacer" />
        <button
          class="btn ml-10 btn role-primary"
          @click="doLogout(true)"
        >
          {{ t('promptSlo.all', { name }) }}
        </button>
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .btn-block {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 0;
  }
</style>
