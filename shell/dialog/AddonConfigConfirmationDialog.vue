<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
  },
  props: {
    resources: {
      type:     Array,
      required: true
    },
    registerBackgroundClosing: {
      type:     Function,
      required: true
    }
  },
  created() {
    this.registerBackgroundClosing(this.closing);
  },
  methods: {
    continue(value) {
      if (this.resources[0]) {
        this.resources[0](value);
        delete this.resources[0];
        this.$emit('close', value);
      }
    },

    close() {
      this.continue(false);
    },

    closing() {
      this.continue(false);
    },

    apply(buttonDone) {
      this.continue(true);
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
      <h4 class="text-default-text">
        {{ t('addonConfigConfirmation.title') }}
      </h4>
    </template>

    <template #body>
      <slot name="body">
        {{ t('addonConfigConfirmation.body') }}
      </slot>
    </template>

    <template #actions>
      <div class="bottom">
        <div class="buttons">
          <button
            type="button"
            class="btn role-secondary mr-10"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            mode="continue"
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

  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
