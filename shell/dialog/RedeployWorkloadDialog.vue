<script>
import { TIMESTAMP } from '@shell/config/labels-annotations';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { resourceNames } from '@shell/utils/string';
import { mapGetters } from 'vuex';

export default {
  emits: ['close'],

  components: { Card, AsyncButton, Banner },

  props: {
    workloads: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      errors: [],
    };
  },

  computed: {
    ...mapGetters({
      t: 'i18n/t',
      labelFor: 'type-map/labelFor',
    }),

    names() {
      return this.workloads.map(({ nameDisplay }) => nameDisplay);
    },

    type() {
      const types = new Set(this.workloads.map(({ type }) => type));

      if (types.size > 1) {
        return this.t('generic.resource', { count: this.workloads.length });
      }

      const [{ schema } = {}] = this.workloads;

      if (!schema) {
        return `resource${this.workloads.length === 1 ? '' : 's'}`;
      }

      return this.labelFor(schema, this.workloads.length);
    },
  },

  methods: {
    resourceNames,

    safeButtonDone(result) {
      if (typeof result === 'function') {
        result(true);
      }
    },

    close(buttonDone) {
      if (typeof buttonDone === 'function') {
        buttonDone(true);
      }
      this.$emit('close');
    },

    async apply(buttonDone) {
      try {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        for (const workload of this.workloads) {
          const metadata = workload.spec.template.metadata || (workload.spec.template.metadata = {});
          const annotations = metadata.annotations || (metadata.annotations = {});

          annotations[TIMESTAMP] = now;

          await workload.save();
        }

        this.close(buttonDone);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        if (typeof buttonDone === 'function') {
          buttonDone(false);
        }
      }
    },
  },
};
</script>

<template>
  <Card class="prompt-redeploy" :show-highlight-border="false">
    <template #title>
      <h4 class="text-default-text">{{ t('promptRedeploy.title') }}</h4>
    </template>

    <template #body>
      <div class="mb-10">
        <span
          v-clean-html="t('promptRedeploy.attemptingToRedeploy', {
            type,
            names: resourceNames(names, null, t)
          })"
        />
        <Banner
          v-for="(error, i) in errors"
          :key="i"
          color="error"
          :label="error"
        />
      </div>
    </template>

    <template #actions>
      <button class="btn role-secondary" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <div class="spacer" />
      <AsyncButton
        class="btn bg-error ml-10"
        :action-label="t('asyncButton.redeploy.action')"
        @click="apply"
      />
    </template>
  </Card>
</template>

<style lang="scss">
.prompt-redeploy {
  &.card-container {
    box-shadow: none;
  }

  .card-actions {
    .spacer {
      flex: 1;
    }
  }
}
</style>
