<script>
import { exceptionToErrorsArray } from '@shell/utils/error';

import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { errors: [] };
  },

  computed: {
    config() {
      return this.resources[0];
    },

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
        this.config.downloadData(btnCb);
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
  <Card class="prompt-restore" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="title" />

    <template slot="body">
      <slot name="body">
        <div class="pl-10 pr-10" style="min-height: 50px;">
          <div class="row">
            {{ body }}
          </div>

          <AsyncButton
            mode="timing"
            class="row mt-20"
            @click="config.gatherResponseTimes"
          />
        </div>
      </slot>
    </template>

    <div slot="actions" class="bottom">
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          :mode="applyMode"
          @click="apply"
        />
      </div>
    </div>
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
