<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    url: {
      type:    String,
      default: null,
    },
    name: {
      type:    String,
      default: null,
    }
  },

  data() {
    return { errors: [] };
  },
  methods: {
    close(buttonDone) {
      if (buttonDone && typeof buttonDone === 'function') {
        buttonDone(true);
      }
      this.$emit('close');
    },
    async apply(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:    this.url,
          method: 'post'
        });

        this.close(buttonDone);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>
<template>
  <Card
    class="prompt-deactivate"
    :show-highlight-border="false"
    :data-testid="'prompt-deactivate'"
  >
    <h4
      slot="title"
      v-clean-html="t('drivers.deactivate.title')"
      class="text-default-text"
    />

    <template #body>
      <div class="pl-10 pr-10">
        <div class="text info mb-10 mt-20">
          <span v-clean-html="t('drivers.deactivate.warning', {name})" />
        </div>
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
      </div>
    </template>

    <template #actions>
      <button
        class="btn role-secondary"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
      <div class="spacer" />
      <AsyncButton
        mode="deactivate"
        class="btn bg-error ml-10"
        :data-testid="'deactivate-driver-confirm'"
        @click="apply"
      />
    </template>
  </Card>
</template>

<style lang='scss'>
  .prompt-deactivate {
    &.card-container {
      box-shadow: none;
    }
    #confirm {
      width: 90%;
      margin-left: 3px;
    }

    .actions {
      text-align: right;
    }

    .card-actions {
      display: flex;

      .spacer {
        flex: 1;
      }
    }
  }
</style>
