<script>
import { mapState, mapGetters } from 'vuex';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import Date from '@shell/components/formatter/Date.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { CAPI, NORMAN, SNAPSHOT } from '@shell/config/types';
import { set } from '@shell/utils/object';
import ChildHook, { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import day from 'dayjs';
import { sortBy } from '@shell/utils/sort';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import AppModal from '@shell/components/AppModal.vue';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
    Date,
    LabeledSelect,
    RadioGroup,
    AppModal,
  },

  name: 'PromptRestore',

  mixins: [
    ChildHook,
  ],

  data() {
    return {
      errors:           [],
      labels:           {},
      restoreMode:      'all',
      loaded:           false,
      allSnapshots:     {},
      sortedSnapshots:  [],
      selectedSnapshot: null,
    };
  },

  computed: {
    // toRestore can be a provisioning.cattle.io.cluster or a rke.cattle.io.etcdsnapshot or an etcdBackup resource
    ...mapState('action-menu', ['showPromptRestore', 'toRestore']),
    ...mapGetters({ t: 'i18n/t' }),

    // Was the dialog opened to restore a specific snapshot, or opened on a cluster to choose
    isCluster() {
      const isSnapshot = this.toRestore[0]?.type.toLowerCase() === NORMAN.ETCD_BACKUP ||
      this.toRestore[0]?.type.toLowerCase() === SNAPSHOT;

      return !isSnapshot;
    },

    snapshot() {
      return !this.isCluster ? this.toRestore[0] : this.allSnapshots[this.selectedSnapshot];
    },

    hasSnapshot() {
      return !!this.snapshot;
    },

    isRke2() {
      return !!this.snapshot?.rke2;
    },

    clusterSnapshots() {
      if (this.sortedSnapshots) {
        return this.sortedSnapshots.map((snapshot) => ({ label: this.snapshotLabel(snapshot), value: snapshot.name }));
      } else {
        return [];
      }
    },
    restoreModeOptions() {
      const etcdOption = this.isRke2 ? 'none' : 'etcd';

      return [etcdOption, 'kubernetesVersion', 'all'];
    }
  },

  watch: {
    async showPromptRestore(show) {
      if (show) {
        this.loaded = true;
        await this.fetchSnapshots();
        this.selectDefaultSnapshot();
      } else {
        this.loaded = false;
      }
    }
  },

  methods: {
    close() {
      this.errors = [];
      this.labels = {};
      this.$store.commit('action-menu/togglePromptRestore');
      this.selectedSnapshot = null;
    },

    // If the user needs to choose a snapshot, fetch all snapshots for the cluster
    async fetchSnapshots() {
      if (!this.isCluster) {
        return;
      }

      const cluster = this.toRestore?.[0];
      let promise;

      if (!cluster?.isRke2) {
        promise = this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP }).then((snapshots) => {
          return snapshots.filter((s) => s.state === STATES_ENUM.ACTIVE && s.clusterId === cluster.metadata.name);
        });
      } else {
        promise = this.$store.dispatch('management/findAll', { type: SNAPSHOT }).then((snapshots) => {
          const toRestoreClusterName = cluster?.clusterName || cluster?.metadata?.name;

          return snapshots.filter((s) => s?.snapshotFile?.status === STATES_ENUM.SUCCESSFUL && s.clusterName === toRestoreClusterName
          );
        });
      }

      // Map of snapshots by name
      const allSnapshots = await promise.then((snapshots) => {
        return snapshots.reduce((v, s) => {
          v[s.name] = s;

          return v;
        }, {});
      }).catch((err) => {
        this.errors = exceptionToErrorsArray(err);
      });

      this.allSnapshots = allSnapshots;
      this.sortedSnapshots = sortBy(Object.values(this.allSnapshots), ['snapshotFile.createdAt', 'created', 'metadata.creationTimestamp'], true);
    },

    selectDefaultSnapshot() {
      if (this.selectedSnapshot) {
        return;
      }

      const defaultSnapshot = this.toRestore[0]?.type === SNAPSHOT ? this.toRestore[0].name : this.clusterSnapshots[0]?.value;

      this['selectedSnapshot'] = defaultSnapshot;
    },

    async apply(buttonDone) {
      try {
        if ( this.isRke2 ) {
          const cluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.snapshot.clusterId);

          await this.applyHooks(BEFORE_SAVE_HOOKS);

          const now = cluster.spec?.rkeConfig?.etcdSnapshotRestore?.generation || 0;

          set(cluster, 'spec.rkeConfig.etcdSnapshotRestore', {
            generation:       now + 1,
            name:             this.snapshot.name,
            restoreRKEConfig: this.restoreMode,
          });

          await cluster.save();
        } else {
          await this.$store.dispatch('rancher/request', {
            url:    `/v3/clusters/${ escape(this.snapshot.clusterId) }?action=restoreFromEtcdBackup`,
            method: 'post',
            data:   {
              etcdBackupId:     this.snapshot.id,
              restoreRkeConfig: this.restoreMode,
            },
          });
        }

        this.$store.dispatch('growl/success', {
          title:   this.t('promptRestore.notification.title'),
          message: this.t('promptRestore.notification.message', { selectedSnapshot: this.selectedSnapshot })
        }, { root: true });

        buttonDone(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
    snapshotLabel(snapshot) {
      const dateFormat = escapeHtml(this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      const created = snapshot.createdAt || snapshot.created || snapshot.metadata.creationTimestamp;
      const d = day(created).format(dateFormat);
      const t = day(created).format(timeFormat);

      return `${ d } ${ t } : ${ snapshot.nameDisplay }`;
    }
  }
};
</script>

<template>
  <app-modal
    v-if="loaded"
    custom-class="promptrestore-modal"
    name="promptRestore"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :scrollable="true"
    @close="close"
  >
    <Card
      v-if="loaded"
      class="prompt-restore"
      :show-highlight-border="false"
    >
      <template #title>
        <h4
          v-clean-html="t('promptRestore.title', null, true)"
          class="text-default-text"
        />
      </template>

      <template #body>
        <div class="pl-10 pr-10">
          <form>
            <h3 v-t="'promptRestore.name'" />
            <div v-if="!isCluster">
              {{ snapshot.nameDisplay }}
            </div>

            <LabeledSelect
              v-if="isCluster"
              v-model:value="selectedSnapshot"
              :label="t('promptRestore.label')"
              :placeholder="t('promptRestore.placeholder')"
              :options="clusterSnapshots"
            />

            <div class="spacer" />

            <h3 v-t="'promptRestore.date'" />
            <div>
              <p>
                <Date
                  v-if="snapshot"
                  :value="snapshot.createdAt || snapshot.created || snapshot.metadata.creationTimestamp"
                />
              </p>
            </div>
            <div class="spacer" />
            <RadioGroup
              v-model:value="restoreMode"
              name="restoreMode"
              label="Restore Type"
              :labels="['Only etcd', 'Kubernetes version and etcd', 'Cluster config, Kubernetes version and etcd']"
              :options="restoreModeOptions"
            />
          </form>
        </div>
      </template>

      <template #actions>
        <div class="dialog-actions">
          <button
            class="btn role-secondary"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>

          <AsyncButton
            mode="restore"
            :disabled="!hasSnapshot"
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
  </app-modal>
</template>

<style lang='scss' scoped>
  .promptrestore-modal {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }

    .prompt-restore form p {
      min-height: 16px;
    }

    // Position dialog buttons on the right-hand side of the dialog
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .prompt-restore :deep() .card-wrap .card-actions {
    display: block;

    button:not(:last-child) {
      margin-right: 10px;
    }

    .banner {
      display: flex;
    }
  }
</style>
