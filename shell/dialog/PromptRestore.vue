<script>
import { mapGetters } from 'vuex';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { RcModal } from '@components/RcModal';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { CAPI, SNAPSHOT, OPERATION, MANAGEMENT } from '@shell/config/types';
import { set } from '@shell/utils/object';
import ChildHook, { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import day from 'dayjs';
import { sortBy } from '@shell/utils/sort';
import { createOperationCR } from '@shell/utils/operation-cr';
import { SNAPSHOT_RESTORE_MODE_OPTIONS } from '@shell/config/labels-annotations';

const RESTORE_MODE = {
  NONE:               'none',
  KUBERNETES_VERSION: 'kubernetesVersion',
  ALL:                'all',
};

export default {
  components: {
    AsyncButton,
    Banner,
    LabeledSelect,
    RadioGroup,
    RcModal,
  },

  name: 'PromptRestore',

  props: {
    /**
     * `show` and the `close` handler, from whoever owns this dialog's visibility
     */
    modal: {
      type:     Object,
      required: true
    },

    /**
     * What to restore: a provisioning.cattle.io.cluster (choose one of its snapshots) or a rke.cattle.io.etcdsnapshot
     */
    resources: {
      type:    Array,
      default: () => []
    },
  },

  mixins: [
    ChildHook,
  ],

  data() {
    return {
      errors:           [],
      restoreMode:      RESTORE_MODE.ALL,
      allSnapshots:     {},
      sortedSnapshots:  [],
      selectedSnapshot: null,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    toRestore() {
      return this.resources || [];
    },

    // Was the dialog opened to restore a specific snapshot, or opened on a cluster to choose
    isCluster() {
      const isSnapshot = this.toRestore[0]?.type?.toLowerCase() === SNAPSHOT;

      return !isSnapshot;
    },

    snapshot() {
      return !this.isCluster ? this.toRestore[0] : this.allSnapshots[this.selectedSnapshot];
    },

    hasSnapshot() {
      return !!this.snapshot;
    },

    targetCluster() {
      if (this.isCluster) {
        return this.toRestore?.[0] || null;
      }

      if (this.snapshot?.cluster) {
        return this.snapshot.cluster;
      }

      const snapshotClusterName = this.snapshot?.spec?.clusterName || this.snapshot?.clusterName;
      const snapshotClusterId = this.snapshot?.clusterId || (snapshotClusterName ? `${ this.snapshot?.metadata?.namespace }/${ snapshotClusterName }` : null);

      if (!snapshotClusterId) {
        return null;
      }

      return this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, snapshotClusterId);
    },

    targetMgmtCluster() {
      if (this.targetCluster?.mgmt) {
        return this.targetCluster.mgmt;
      }

      const mgmtClusterId = this.snapshot?.spec?.clusterName;

      if (!mgmtClusterId) {
        return null;
      }

      return this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, mgmtClusterId);
    },

    // Imported clusters with day 2 ops are restored via an operation CR rather than spec.rkeConfig.etcdSnapshotRestore
    isImportedWithDayTwoOps() {
      return !!(this.targetCluster?.isImportedWithDayTwoOps || this.targetMgmtCluster?.isDayTwoOpsEnabled);
    },

    // Restoring the Kubernetes version of an imported cluster only makes sense when Rancher manages its version
    canRestoreKubernetesVersion() {
      if (!this.isImportedWithDayTwoOps) {
        return true;
      }

      return !!this.targetMgmtCluster?.isVersionManagementEnabled;
    },

    clusterSnapshots() {
      if (this.sortedSnapshots) {
        return this.sortedSnapshots.map((snapshot) => ({ label: this.snapshotLabel(snapshot), value: snapshot.name }));
      } else {
        return [];
      }
    },
    // Restore modes the selected snapshot advertises (comma-separated annotation set by the backend), or null if it doesn't say
    snapshotRestoreModes() {
      const annotation = this.snapshot?.metadata?.annotations?.[SNAPSHOT_RESTORE_MODE_OPTIONS];
      const modes = (annotation || '').split(',').map((m) => m.trim()).filter((m) => !!m);

      return modes.length ? modes : null;
    },
    restoreModes() {
      const allModes = [
        { value: RESTORE_MODE.NONE, label: this.t('promptRestore.restoreMode.onlyEtcd') },
        { value: RESTORE_MODE.KUBERNETES_VERSION, label: this.t('promptRestore.restoreMode.kubernetesVersionAndEtcd') },
        { value: RESTORE_MODE.ALL, label: this.t('promptRestore.restoreMode.clusterConfigKubernetesVersionAndEtcd') }
      ];
      const allowedByCluster = this.canRestoreKubernetesVersion ? allModes : allModes.filter((m) => m.value === RESTORE_MODE.NONE);
      const offered = this.snapshotRestoreModes;

      if (!offered) {
        return allowedByCluster;
      }

      const modes = allowedByCluster.filter((m) => offered.includes(m.value));

      // Restoring only etcd is always possible, so never leave the user without an option
      return modes.length ? modes : allModes.filter((m) => m.value === RESTORE_MODE.NONE);
    },
    restoreModeLabels() {
      return this.restoreModes.map((m) => m.label);
    },
    restoreModeOptions() {
      return this.restoreModes.map((m) => m.value);
    },
    // The most complete restore mode available is the default, matching the RKE2 behaviour
    defaultRestoreMode() {
      return this.restoreModeOptions[this.restoreModeOptions.length - 1];
    }
  },

  watch: {
    // Never keep a restore mode that is no longer offered (selected snapshot changed, or the target cluster resolved late)
    restoreModeOptions(options) {
      if (!options.includes(this.restoreMode)) {
        this.restoreMode = this.defaultRestoreMode;
      }
    }
  },

  // The dialog is mounted each time it is opened, so this is the per-open setup
  async created() {
    this.restoreMode = this.defaultRestoreMode;
    await this.fetchSnapshots();
    this.selectDefaultSnapshot();
  },

  methods: {
    close() {
      this.modal.onClose();
    },

    // If the user needs to choose a snapshot, fetch all snapshots for the cluster
    async fetchSnapshots() {
      if (!this.isCluster) {
        return;
      }

      const cluster = this.toRestore?.[0];
      const promise = this.$store.dispatch('management/findAll', { type: SNAPSHOT }).then((snapshots) => {
        const toRestoreClusterName = cluster?.clusterName || cluster?.metadata?.name;

        return snapshots.filter((s) => s?.restoreEnabled && s.clusterName === toRestoreClusterName
        );
      });

      // Map of snapshots by name
      const allSnapshots = await promise.then((snapshots) => {
        return snapshots.reduce((v, s) => {
          v[s.name] = s;

          return v;
        }, {});
      }).catch((err) => {
        this.errors = exceptionToErrorsArray(err);
      });

      this.allSnapshots = allSnapshots || {};
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
        const cluster = this.targetCluster;
        const mgmtCluster = cluster?.mgmt || this.targetMgmtCluster;

        await this.applyHooks(BEFORE_SAVE_HOOKS);

        // For imported clusters with day 2 ops enabled, create an operation CR
        if (this.isImportedWithDayTwoOps) {
          if (!mgmtCluster) {
            throw new Error(this.t('promptRestore.error.unableToResolveTargetCluster'));
          }
          const namespace = mgmtCluster?.id;
          const safePrefix = mgmtCluster?.id;
          const spec = {
            clusterRef: {
              apiVersion: 'management.cattle.io/v3',
              kind:       'Cluster',
              name:       mgmtCluster?.id,
            },
            args: {
              name:        this.snapshot?.metadata?.name,
              restoreMode: this.restoreModeOptions.includes(this.restoreMode) ? this.restoreMode : RESTORE_MODE.NONE,
            },
          };

          await createOperationCR(this.$store.dispatch, OPERATION.ETCD_SNAPSHOT_RESTORE, spec, namespace, safePrefix);
        } else {
          const now = cluster.spec?.rkeConfig?.etcdSnapshotRestore?.generation || 0;

          set(cluster, 'spec.rkeConfig.etcdSnapshotRestore', {
            generation:       now + 1,
            name:             this.snapshot.name,
            restoreRKEConfig: this.restoreMode,
          });

          await cluster.save();
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
  <RcModal
    v-bind="modal"
    :title="t('promptRestore.title')"
    class="restore-snapshot"
    data-testid="restore-snapshot-dialog"
  >
    <div class="restore-snapshot__snapshot">
      <h3 v-t="'promptRestore.name'" />
      <div
        v-if="!isCluster"
        data-testid="restore-snapshot-name"
      >
        {{ snapshot && snapshot.nameDisplay }}
      </div>

      <LabeledSelect
        v-if="isCluster"
        v-model:value="selectedSnapshot"
        :label="t('promptRestore.label')"
        :placeholder="t('promptRestore.placeholder')"
        :options="clusterSnapshots"
        data-testid="restore-snapshot-select"
      />
    </div>

    <RadioGroup
      v-model:value="restoreMode"
      name="restoreMode"
      :label="t('promptRestore.restoreMode.label')"
      :labels="restoreModeLabels"
      :options="restoreModeOptions"
      data-testid="restore-snapshot-mode"
    />

    <Banner
      v-for="(err, i) in errors"
      :key="i"
      color="error"
      role="alert"
      :label="err"
      class="restore-snapshot__error"
    />

    <template #primary-action>
      <AsyncButton
        mode="restore"
        :disabled="!hasSnapshot"
        data-testid="restore-snapshot-confirm"
        @click="apply"
      />
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  .restore-snapshot {
    &__snapshot h3 {
      margin-bottom: 10px;
    }

    &__error {
      margin: 0;
    }
  }
</style>
