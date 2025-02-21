<script>
import { LabeledInput } from '@components/Form/LabeledInput';

import { RadioGroup } from '@components/Form/Radio';

import S3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config';
import UnitInput from '@shell/components/form/UnitInput';

export default {
  emits: ['s3-backup-changed', 'config-etcd-expose-metrics-changed'],

  components: {
    LabeledInput,
    RadioGroup,
    S3Config,
    UnitInput
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
    selectedVersion: {
      type:     Object,
      required: true,
    },

    s3Backup: {
      type:     Boolean,
      required: false,
      default:  false
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },

  },

  computed: {
    etcd() {
      return this.value.spec.rkeConfig.etcd;
    },
    argsEtcdExposeMetrics() {
      return !!this.selectedVersion?.serverArgs['etcd-expose-metrics'];
    },
    configEtcdExposeMetrics() {
      return !!this.value.spec.rkeConfig.machineGlobalConfig['etcd-expose-metrics'];
    },

  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model:value="etcd.disableSnapshots"
          name="etcd-disable-snapshots"
          :options="[true, false]"
          :label="t('cluster.rke2.etcd.disableSnapshots.label')"
          :labels="[t('generic.disable'), t('generic.enable')]"
          :mode="mode"
        />
      </div>
    </div>
    <div
      v-if="etcd.disableSnapshots !== true"
      class="row"
    >
      <div class="col span-6">
        <LabeledInput
          v-model:value="etcd.snapshotScheduleCron"
          type="cron"
          placeholder="0 * * * *"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotScheduleCron.label')"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model:value="etcd.snapshotRetention"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotRetention.label')"
          :suffix="t('cluster.rke2.snapshots.suffix')"
          :tooltip="t('cluster.rke2.etcd.snapshotRetention.tooltip')"
        />
      </div>
    </div>

    <template v-if="etcd.disableSnapshots !== true">
      <div class="spacer" />

      <RadioGroup
        :value="s3Backup"
        name="etcd-s3"
        :options="[false, true]"
        :label="t('cluster.rke2.etcd.s3backups.label')"
        :labels="[t('generic.disable'),t('generic.enable')]"
        :mode="mode"
        @update:value="$emit('s3-backup-changed', $event)"
      />

      <S3Config
        v-if="s3Backup"
        v-model:value="etcd.s3"
        :namespace="value.metadata.namespace"
        :register-before-hook="registerBeforeHook"
        :mode="mode"
      />
    </template>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-if="argsEtcdExposeMetrics"
          :value="configEtcdExposeMetrics"
          name="etcd-expose-metrics"
          :options="[false, true]"
          :label="t('cluster.rke2.etcd.exportMetric.label')"
          :labels="[t('cluster.rke2.etcd.exportMetric.false'), t('cluster.rke2.etcd.exportMetric.true')]"
          :mode="mode"
          @update:value="$emit('config-etcd-expose-metrics-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
