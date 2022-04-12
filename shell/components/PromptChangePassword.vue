<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@shell/components/form/ChangePassword';
import Card from '@shell/components/Card';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  components: {
    Card, AsyncButton, ChangePassword
  },
  data() {
    return { valid: false, password: '' };
  },
  computed:   { ...mapGetters({ t: 'i18n/t' }) },
  methods:  {
    show(show) {
      if (show) {
        this.$modal.show('password-modal');
      } else {
        this.$modal.hide('password-modal');
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
  <modal
    class="change-password-modal"
    name="password-modal"
    :width="500"
    :height="465"
  >
    <Card class="prompt-password" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t("changePassword.title") }}
      </h4>
      <div slot="body">
        <form @submit.prevent>
          <ChangePassword ref="changePassword" @valid="valid = $event" />
        </form>
      </div>

      <template #actions>
        <!-- type reset is required by lastpass -->
        <button class="btn role-secondary" type="reset" @click="show(false)">
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
  </modal>
</template>

<style lang="scss" scoped>
    .change-password-modal {
      ::v-deep .v--modal {
        display: flex;

        .card-wrap {
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
    }

    .prompt-password {
      flex: 1;
      display: flex;
      form {
        flex: 1;
      }
    }

</style>
