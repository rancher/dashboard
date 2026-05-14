<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    cluster: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { errors: [] };
  },

  computed: {
    isEnabled() {
      return this.cluster.isDayTwoOpsEnabled;
    },

    title() {
      return this.isEnabled
        ? this.t('day2Ops.disable.title')
        : this.t('day2Ops.enable.title');
    },

    description() {
      return this.isEnabled
        ? this.t('day2Ops.disable.description')
        : this.t('day2Ops.enable.description');
    },

    warning() {
      return this.isEnabled
        ? this.t('day2Ops.disable.warning')
        : this.t('day2Ops.enable.warning');
    },

    actionMode() {
      return this.isEnabled ? 'disable' : 'enable';
    }
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        const mgmt = this.cluster.mgmt;

        if (this.isEnabled) {
          await mgmt.disableDayTwoOps();
        } else {
          await mgmt.enableDayTwoOps();
        }
        buttonDone(true);
        this.close();
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
    class="prompt-day2ops"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>

    <template #body>
      <div class="pl-10 pr-10">
        <Banner
          color="warning"
          :label="warning"
        />
        <p class="pt-10 pb-10">
          {{ description }}
        </p>
      </div>
    </template>

    <template #actions>
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          :mode="actionMode"
          @click="apply"
        />

        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .prompt-day2ops {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>
