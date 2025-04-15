<script>
import { mapGetters, mapState } from 'vuex';
import { resourceNames } from '@shell/utils/string';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  name: 'HelmAppForceUpdateDialog',

  emits: ['close'],

  components: {
    AsyncButton,
    Banner,
    Card,
  },

  props: {
    helmApps: {
      type:     Array,
      required: true,
    },
  },

  data() {
    return { errors: [] };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    names() {
      return this.helmApps.map((app) => app.nameDisplay);
    }
  },

  methods: {
    resourceNames,

    close(buttonDone) {
      if (buttonDone && typeof buttonDone === 'function') {
        buttonDone(true);
      }
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        await Promise.all(this.helmApps.map((app) => this.updateHelmApp(app)));

        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },

    updateHelmApp(app) {
      const now = app.spec.forceSyncGeneration || 1;

      app.spec.forceSyncGeneration = now + 1;

      return app.save();
    },
  }
};
</script>

<template>
  <Card
    class="prompt-force-update"
    :show-highlight-border="false"
  >
    <template #title>
      <h4
        v-clean-html="t('fleet.helmApp.actions.forceUpdate.promptTitle')"
        class="text-default-text"
      />
    </template>

    <template #body>
      <div class="mb-20">
        {{ t('fleet.helmApp.actions.forceUpdate.promptNames') }} <span
          v-clean-html="resourceNames(names, null, t)"
          class="body"
        />
      </div>
      <Banner
        color="info"
        label-key="fleet.helmApp.actions.forceUpdate.promptWarning"
      >
        <span v-clean-html="t('fleet.helmApp.actions.forceUpdate.promptWarning', { count: names.length}, true)" />
      </Banner>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
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
        mode="update"
        class="btn bg-info ml-10"
        :data-testid="'deactivate-driver-confirm'"
        @click="apply"
      />
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .card-container {
    box-shadow: none;
  }

  :deep() .card-actions {
    display: flex;
    justify-content: end;
  }
</style>
