<script>
import { mapGetters } from 'vuex';
import { FLEET, NORMAN } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@rc/Card';
import { Banner } from '@rc/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { set } from '@shell/utils/object';

export default {
  emits: ['close'],

  components: {
    Card,
    LabeledSelect,
    KeyValue,
    AsyncButton,
    Banner
  },

  props: {
    toAssign: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    return {
      errors:        [],
      labels:        {},
      moveTo:        this.workspace,
      loaded:        false,
      allWorkspaces: []
    };
  },

  async fetch() {
    await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER });
    this.allWorkspaces = await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
    this.moveTo = this.workspace;
    this.loaded = true;
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['workspace']),

    workspaceOptions() {
      const out = this.allWorkspaces.map((x) => x.metadata?.name).filter((x) => !!x && x !== 'fleet-local');

      return out;
    },

    resourceCount() {
      return this.toAssign?.length || 0;
    }
  },

  methods: {
    close() {
      this.errors = [];
      this.labels = {};
      this.moveTo = this.workspace;
      this.$emit('close');
    },

    async apply(buttonDone) {
      const promises = [];

      this.errors = [];

      for ( const fleetCluster of this.toAssign ) {
        const c = await this.$store.dispatch(`rancher/clone`, { resource: fleetCluster.norman });

        if ( !c ) {
          continue;
        }

        c.fleetWorkspaceName = this.moveTo;

        for ( const k of Object.keys(this.labels) ) {
          if ( !c._labels ) {
            set(c, '_labels', {});
          }

          set(c._labels, k, this.labels[k]);
        }

        promises.push(c.save());
      }

      try {
        await Promise.all(promises);
        buttonDone(true);
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card
    :show-highlight-border="false"
  >
    <template #title>
      <h4
        v-clean-html="t('assignTo.title', {count: resourceCount}, true)"
        class="text-default-text"
      />
    </template>
    <template #body>
      <div class="pl-10 pr-10">
        <form>
          <LabeledSelect
            v-model:value="moveTo"
            data-testid="workspace_options"
            :label="t('assignTo.workspace')"
            :options="workspaceOptions"
            placement="bottom"
          />

          <KeyValue
            key="labels"
            v-model:value="labels"
            class="mt-20"
            :add-label="t('labels.addSetLabel')"
            :read-allowed="false"
          />

          <Banner
            v-for="(err, i) in errors"
            :key="i"
            color="error"
            :label="err"
          />
        </form>
      </div>
    </template>

    <template #actions>
      <div class="actions-container">
        <button
          class="btn role-secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          class="apply-btn"
          mode="apply"
          @click="apply"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss'>
  .actions-container {
      display: flex;
      justify-content: flex-end;
      width: 100%;

      .apply-btn {
        margin-left: 20px;
      }
    }
</style>
