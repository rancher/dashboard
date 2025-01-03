<script>
import { exceptionToErrorsArray } from '@shell/utils/error';

import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    downloadData: {
      type:     Function,
      required: true
    },
    gatherResponseTimes: {
      type:     Function,
      required: true
    }
  },

  data() {
    return { errors: [] };
  },

  computed: {

    applyMode() {
      return 'diagnostic';
    },

    title() {
      return this.t('about.diagnostic.modal.title');
    },

    body() {
      return this.t('about.diagnostic.modal.body');
    }
  },

  methods: {
    close() {
      this.$emit('close');
    },

    apply(btnCb) {
      try {
        this.downloadData(btnCb);
        this.close();
      } catch (err) {
        console.error(err); // eslint-disable-line
        this.errors = exceptionToErrorsArray(err);
        btnCb(false);
      }
    }
  }
};
</script>

<template>
  <Card
    class="prompt-restore"
    :show-highlight-border="false"
  >
    <template #title>
      <h4
        v-clean-html="title"
        class="text-default-text"
      />
    </template>

    <template #body>
      <slot name="body">
        <div
          class="pl-10 pr-10"
          style="min-height: 50px;"
        >
          <div class="row">
            {{ body }}
          </div>

          <AsyncButton
            mode="timing"
            class="row mt-20"
            @click="gatherResponseTimes"
          />
        </div>
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
            data-testid="download-diagnostics-modal-action"
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
