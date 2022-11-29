<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';

export default {
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
    class="addon-config-confirmation"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text"
    >
      {{ t('addonConfigConfirmation.title') }}
    </h4>

    <template slot="body">
      <slot name="body">
        {{ t('addonConfigConfirmation.body') }}
      </slot>
    </template>

    <div
      slot="actions"
      class="bottom"
    >
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
  </Card>
</template>
<style lang='scss' scoped>
  ::v-deep .card-actions {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
</style>
