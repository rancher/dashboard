<script>
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { IS_SSO, LOGGED_OUT } from '@shell/config/query-params';

export default {
  emits: ['close'],

  components: { Card, AsyncButton },

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

      if (logoutAll) {
        // SLO - Single Log Out
        options.slo = true;
        options.provider = this.authProvider;

        await this.$store.dispatch('auth/logout', options, { root: true });

        this.$emit('close');
      } else {
        // Rancher Log Out (ensure we show the logging out page as per standard log out)
        this.$router.replace({ name: 'auth-logout', query: { [LOGGED_OUT]: true, [IS_SSO]: true } });
      }
    },

    cancel() {
      this.$emit('close');
    }
  }
};
</script>

<template>
  <Card
    class="prompt-remove"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('promptSlo.title', { name }) }}
      </h4>
    </template>
    <template #body>
      <div class="pl-10 pr-10 mt-20 mb-20">
        {{ t('promptSlo.text', { name }) }}
      </div>
    </template>
    <template #actions>
      <div class="btn-block">
        <button
          class="btn role-secondary"
          @click="cancel()"
        >
          {{ t('generic.cancel') }}
        </button>
        <div class="spacer" />
        <button
          class="btn role-secondary"
          @click="doLogout()"
        >
          {{ t('promptSlo.rancher.active') }}
        </button>
        <AsyncButton
          class="ml-10"
          :action-label="t('promptSlo.all.active', { name })"
          :waiting-label="t('promptSlo.all.waiting')"
          @click="doLogout(true)"
        />
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
