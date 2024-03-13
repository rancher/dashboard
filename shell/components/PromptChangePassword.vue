<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@shell/components/form/ChangePassword';
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal.vue';

export default {
  components: {
    Card, AsyncButton, ChangePassword, AppModal
  },
  data() {
    return {
      valid: false, password: '', showModal: false
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  methods:  {
    show(show) {
      if (show) {
        this.showModal = true;
      } else {
        this.showModal = false;
      }
    },
    async submit(buttonCb) {
      try {
        await this.$refs.changePassword.save();
        this.show(false);
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    }
  },
};
</script>

<template>
  <app-modal
    v-if="showModal"
    custom-class="change-password-modal"
    name="password-modal"
    :width="500"
    :height="465"
    @close="show(false)"
  >
    <Card
      class="prompt-password"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t("changePassword.title") }}
      </h4>
      <div slot="body">
        <form @submit.prevent>
          <ChangePassword
            ref="changePassword"
            @valid="valid = $event"
          />
        </form>
      </div>

      <template #actions>
        <!-- type reset is required by lastpass -->
        <button
          class="btn role-secondary"
          type="reset"
          @click="show(false)"
        >
          {{ t("changePassword.cancel") }}
        </button>
        <AsyncButton
          type="submit"
          mode="apply"
          class="btn bg-error ml-10"
          :disabled="!valid"
          value="LOGIN"
          @click="submit"
        />
      </template>
    </Card>
  </app-modal>
</template>

<style lang="scss" scoped>
  .prompt-password {
    ::v-deep .card-wrap {
      display: flex;
      flex-direction: column;

      .card-body {
        flex: 1;
        justify-content: start;
        & > div {
          flex: 1;
          display: flex;
        }
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        width: 100%;
      }
    }
  }

  .prompt-password {
    flex: 1;
    display: flex;
    form {
      flex: 1;
    }
  }
</style>
