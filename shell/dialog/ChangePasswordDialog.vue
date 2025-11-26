<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@shell/components/form/ChangePassword';
import { Card } from '@rc/Card';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  emits:      ['close'],
  components: {
    Card, AsyncButton, ChangePassword
  },
  data() {
    return { valid: false, password: '' };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  methods:  {
    closeModal() {
      this.$emit('close');
    },
    async submit(buttonCb) {
      try {
        await this.$refs.changePassword.save();
        this.closeModal();
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    }
  },
};
</script>

<template>
  <Card
    class="prompt-password"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t("changePassword.title") }}
      </h4>
    </template>

    <template #body>
      <form @submit.prevent>
        <ChangePassword
          ref="changePassword"
          @valid="valid = $event"
        />
      </form>
    </template>

    <template #actions>
      <!-- type reset is required by lastpass -->
      <button
        class="btn role-secondary"
        role="button"
        :aria-label="t('changePassword.cancel')"
        type="reset"
        @click="closeModal"
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
</template>

<style lang="scss" scoped>
  .prompt-password {
    :deep() .card-wrap {
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
