<script>
import PromptChangePassword from '@/components/PromptChangePassword';
import { NORMAN } from '@/config/types';
import Loading from '@/components/Loading';

export default {
  components: { PromptChangePassword, Loading },
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();
  },
  data() {
    return { canChangePassword: false };
  },
  computed:   {
    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },
  },
  methods: {
    async calcCanChangePassword() {
      if (!this.$store.getters['auth/enabled']) {
        return false;
      }

      if (this.principal.provider === 'local') {
        return !!this.principal.loginName;
      }

      const users = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.USER,
        opt:  { url: '/v3/users', filter: { me: true } }
      });

      if (users && users.length === 1) {
        return !!users[0].username;
      }

      return false;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 v-t="'accountAndKeys.title'" />
    <section class="account">
      <h4 v-t="'accountAndKeys.account.title'" />
      <div class="content">
        <div class="col mt-10">
          <div><t k="accountAndKeys.account.name" />: {{ principal.name }}</div>
          <div><t k="accountAndKeys.account.username" />: {{ principal.loginName }}</div>
        </div>
        <button
          v-if="canChangePassword"
          type="button"
          class="btn role-secondary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
      <PromptChangePassword ref="promptChangePassword" />
    </section>

    <section>
      <h4 v-t="'accountAndKeys.keys.title'" />
    </section>
  </div>
</template>

<style lang='scss' scoped>
  section {
    margin-bottom: 10px;
  }

  .account {
    .content {
      display: flex;
    }
  }
</style>
