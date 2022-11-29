<script>
import { mapState, mapGetters } from 'vuex';
import { FLEET, NORMAN } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { set } from '@shell/utils/object';

export default {
  components: {
    Card,
    LabeledSelect,
    KeyValue,
    AsyncButton,
    Banner,
  },

  data() {
    return {
      errors:        [],
      labels:        {},
      moveTo:        this.workspace,
      loaded:        false,
      allWorkspaces: [],
    };
  },

  computed: {
    ...mapState('action-menu', ['showAssignTo', 'toAssign']),
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['workspace']),

    workspaceOptions() {
      const out = this.allWorkspaces.map(x => x.metadata?.name).filter(x => !!x && x !== 'fleet-local');

      return out;
    },

    resourceCount() {
      return this.toAssign?.length || 0;
    }
  },

  watch: {
    async showAssignTo(show) {
      if (show) {
        await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER });
        this.allWorkspaces = await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
        this.moveTo = this.workspace;
        this.loaded = true;
        this.$modal.show('assignTo');
      } else {
        this.$modal.hide('assignTo');
      }
    }
  },

  methods: {
    close() {
      this.errors = [];
      this.labels = {};
      this.moveTo = this.workspace;
      this.$store.commit('action-menu/toggleAssignTo');
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
  <modal
    class="assign-modal"
    name="assignTo"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :scrollable="true"
  >
    <Card
      v-if="loaded"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
        v-html="t('assignTo.title', {count: resourceCount}, true)"
      />

      <div
        slot="body"
        class="pl-10 pr-10"
      >
        <form>
          <LabeledSelect
            v-model="moveTo"
            :label="t('assignTo.workspace')"
            :options="workspaceOptions"
            placement="bottom"
          />

          <KeyValue
            key="labels"
            v-model="labels"
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

      <div slot="actions">
        <button
          class="btn role-secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="apply"
          @click="apply"
        />
      </div>
    </Card>
  </modal>
</template>

<style lang='scss'>
  .assign-modal {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }
  }
</style>
