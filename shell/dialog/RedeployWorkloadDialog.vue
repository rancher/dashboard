<script lang="ts">
import { TIMESTAMP } from '@shell/config/labels-annotations';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@rc/Card';
import { Banner } from '@rc/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { resourceNames } from '@shell/utils/string';
import { mapGetters } from 'vuex';

interface Workload {
  nameDisplay: string;
  type: string;
  schema?: any;
  spec: {
    template: {
      metadata?: {
        annotations?: Record<string, string>;
      };
    };
  };
  save: () => Promise<void>;
}

export default {
  name: 'RedeployWorkloadDialog',

  emits: ['close'],

  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    workloads: {
      type:     Array as () => Workload[],
      required: true,
    },
  },

  data() {
    return { errors: [] };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t', labelFor: 'type-map/labelFor' }),

    names(): string[] {
      return this.workloads.map(({ nameDisplay }) => nameDisplay);
    },

    type(): string {
      const types = new Set(this.workloads.map(({ type }) => type));

      if (types.size > 1) {
        return this.t('generic.resource', { count: this.workloads.length });
      }

      const [{ schema } = {}] = this.workloads;

      if (!schema) {
        return `resource${ this.workloads.length === 1 ? '' : 's' }`;
      }

      return this.labelFor(schema, this.workloads.length);
    },
  },

  methods: {
    resourceNames,

    close(): void {
      this.$emit('close');
    },

    async apply(buttonDone?: (success: boolean) => void): Promise<void> {
      try {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        for (const workload of this.workloads) {
          const metadata = workload.spec.template.metadata ??= {};
          const annotations = metadata.annotations ??= {};

          annotations[TIMESTAMP] = now;

          await workload.save();
        }

        buttonDone?.(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone?.(false);
      }
    },
  },
};
</script>

<template>
  <Card
    role="alertdialog"
    aria-modal="true"
    class="prompt-redeploy"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('promptRedeploy.title', { type }) }}
      </h4>
    </template>

    <template #body>
      <div class="mb-10">
        <span
          v-clean-html="t('promptRedeploy.attemptingToRedeploy', {
            type,
            names: resourceNames(names, null, t),
          })"
        />
        <Banner
          v-for="(error, i) in errors"
          :key="i"
          role="alert"
          color="error"
          :label="error"
        />
      </div>
    </template>

    <template #actions>
      <button
        role="button"
        class="btn role-secondary"
        :aria-label="t('generic.cancel')"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
      <div class="spacer" />
      <AsyncButton
        role="button"
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
