<script setup lang="ts">

import { computed } from 'vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { RcSection, SECTION_TYPE } from '@components/RcSection';
import UnitInput from '@shell/components/form/UnitInput.vue';
import RcS3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/RcS3Config.vue';
import { RETENTION_DEFAULT } from '@shell/edit/provisioning.cattle.io.cluster/shared';
import { useEtcdSnapshotConfig } from '@shell/composables/useEtcdSnapshotConfig';
import type { EtcdSnapshotConfigValue, EtcdSnapshotS3 } from '@shell/composables/useEtcdSnapshotConfig';

defineOptions({ name: 'RcEtcdSnapshotConfig' });

const props = withDefaults(defineProps<{
  mode: string;
  /** The etcd config object. May be empty when the cluster has no etcd config yet (e.g. imported clusters) */
  value?: EtcdSnapshotConfigValue | null;
  /** Whether saving snapshots to S3 is enabled */
  s3Backup?: boolean;
  /** Namespace used when selecting/creating the S3 cloud credential */
  namespace: string;
  registerBeforeHook: Function;
}>(), {
  value:    null,
  s3Backup: false,
});

const emit = defineEmits<{
  'update:value': [value: EtcdSnapshotConfigValue];
  's3-backup-changed': [value: boolean];
  'validation-changed': [value: boolean];
}>();

const {
  etcd,
  snapshotsEnabled,
  disableSnapshotsOptions,
  s3BackupOptions,
  cronScheduleRules,
  update,
  s3BackupChanged,
  disableSnapshotsChanged,
  s3ValidationChanged,
} = useEtcdSnapshotConfig(props, emit);

// An unset schedule/retention (empty, or 0 as returned for an imported cluster) isn't written to the cluster, which then
// keeps its own settings. So show them empty, with the RKE2/K3s defaults as placeholders
const SNAPSHOT_SCHEDULE_CRON_DISTRO_DEFAULT = '0 */12 * * *';
const snapshotRetention = computed(() => etcd.value.snapshotRetention || undefined);
</script>

<template>
  <RcSection
    :title="t('cluster.rke2.etcd.disableSnapshots.label')"
    mode="with-header"
    :type="SECTION_TYPE.SECONDARY"
    expandable
    data-testid="etcd-automatic-backups"
  >
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          :value="!snapshotsEnabled"
          name="etcd-disable-snapshots"
          data-testid="etcd-disable-snapshots"
          :options="disableSnapshotsOptions"
          :mode="mode"
          @update:value="disableSnapshotsChanged"
        />
      </div>
    </div>
    <div
      v-if="snapshotsEnabled"
      class="row"
      :class="{ 'has-cron-hint': !!etcd.snapshotScheduleCron }"
    >
      <div class="col span-6">
        <LabeledInput
          :value="etcd.snapshotScheduleCron"
          type="cron"
          :placeholder="SNAPSHOT_SCHEDULE_CRON_DISTRO_DEFAULT"
          data-testid="etcd-snapshot-schedule-cron"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotScheduleCron.label')"
          :rules="cronScheduleRules"
          :require-dirty="false"
          @update:value="(snapshotScheduleCron: string) => update({ snapshotScheduleCron })"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          :value="snapshotRetention"
          :placeholder="RETENTION_DEFAULT"
          data-testid="etcd-snapshot-retention"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotRetention.label')"
          :suffix="s3Backup ? t('cluster.rke2.snapshots.s3Suffix') : t('cluster.rke2.snapshots.suffix')"
          :tooltip="s3Backup ? t('cluster.rke2.etcd.snapshotRetention.tooltip') : undefined"
          @update:value="(snapshotRetention: number) => update({ snapshotRetention })"
        />
      </div>
    </div>

    <RcSection
      v-if="snapshotsEnabled"
      :title="t('cluster.rke2.etcd.s3backups.label')"
      mode="with-header"
      :type="SECTION_TYPE.SECONDARY"
      expandable
      :expanded="false"
      data-testid="etcd-s3-backups"
    >
      <RadioGroup
        :value="s3Backup"
        name="etcd-s3"
        data-testid="etcd-s3-backup"
        :options="s3BackupOptions"
        :mode="mode"
        @update:value="s3BackupChanged"
      />

      <RcS3Config
        v-if="s3Backup"
        :value="etcd.s3 || undefined"
        :local-retention-count="snapshotRetention"
        :namespace="namespace"
        :register-before-hook="registerBeforeHook"
        :mode="mode"
        @update:value="(s3: EtcdSnapshotS3) => update({ s3 })"
        @validationChanged="s3ValidationChanged"
      />
    </RcSection>
  </RcSection>
</template>

<style lang="scss" scoped>
// LabeledInput shows the cron description under the input, absolutely positioned, so make room for it
.has-cron-hint {
  margin-bottom: var(--gap-lg, 24px);
}
</style>
