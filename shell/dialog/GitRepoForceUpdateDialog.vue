<script>
import { mapGetters, mapState } from 'vuex';
import { resourceNames } from '@shell/utils/string';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  name: 'GitRepoForceUpdateDialog',

  emits: ['close'],

  components: {
    AsyncButton,
    Banner,
    Card,
  },

  props: {
    repositories: {
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
      return this.repositories.map((repository) => repository.nameDisplay);
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
        await Promise.all(this.repositories.map((repository) => this.updateGitRepo(repository)));

        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },

    updateGitRepo(repository) {
      const now = repository.spec.forceSyncGeneration || 1;

      repository.spec.forceSyncGeneration = now + 1;

      return repository.save();
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
        v-clean-html="t('fleet.gitRepo.actions.forceUpdate.promptTitle')"
        class="text-default-text"
      />
    </template>

    <template #body>
      <div class="mb-20">
        {{ t('fleet.gitRepo.actions.forceUpdate.promptNames') }} <span
          v-clean-html="resourceNames(names, t)"
          class="body"
        />
      </div>
      <Banner
        color="info"
        label-key="fleet.gitRepo.actions.forceUpdate.promptWarning"
      >
        <span v-clean-html="t('fleet.gitRepo.actions.forceUpdate.promptWarning', { count: names.length}, true)" />
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
