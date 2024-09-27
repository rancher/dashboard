<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { decodeHtml } from '@shell/utils/string';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    Banner,
  },
  props: {
    applyAction: {
      type:    Function,
      default: () => {}
    },
    applyMode: {
      type:    String,
      default: 'create'
    },
    title: {
      type:    String,
      default: ''
    },
    body: {
      type:    String,
      default: ''
    },

    /**
     * Callback to identify response of the prompt
     */
    confirm: {
      type:    Function,
      default: () => { }
    },
  },
  data() {
    return { errors: [] };
  },

  methods: {
    decodeHtml,
    close() {
      this.confirm(false);
      this.$emit('close', false);
    },

    async apply(buttonDone) {
      try {
        await this.applyAction(buttonDone);
        this.confirm(true);
        this.$emit('close', true);
      } catch (err) {
        console.error(err); // eslint-disable-line
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  },
};
</script>

<template>
  <Card
    class="prompt-restore"
    :show-highlight-border="false"
  >
    <template #title>
      <slot name="title">
        <h4
          v-clean-html="title"
          class="text-default-text"
        />
      </slot>
    </template>

    <template #body>
      <slot name="body">
        <div
          v-clean-html="decodeHtml(body)"
          class="pl-10 pr-10"
          style="min-height: 50px; display: flex;"
        />
      </slot>
    </template>

    <template #actions>
      <div class="bottom">
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
        <div class="buttons">
          <button
            class="btn role-secondary mr-10"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>

          <AsyncButton
            :mode="applyMode"
            @click="apply"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-restore {
    margin: 0;
  }
  .bottom {
    display: flex;
    flex-direction: column;
    flex: 1;
    .banner {
      margin-top: 0
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  }

</style>
