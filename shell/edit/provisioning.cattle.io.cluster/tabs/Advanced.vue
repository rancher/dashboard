<script>
import { _VIEW } from '@shell/config/query-params';
import { Banner } from '@components/Banner';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import ArrayList from '@shell/components/form/ArrayList';
import { Checkbox } from '@components/Form/Checkbox';
import DirectoryConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig.vue';

export default {
  components: {
    Banner,
    ArrayListGrouped,
    MatchExpressions,
    ArrayList,
    Checkbox,
    DirectoryConfig
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

    haveArgInfo: {
      type:     Boolean,
      required: true
    },

    selectedVersion: {
      type:     Object,
      required: true
    },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },
    agentArgs() {
      return this.selectedVersion?.agentArgs || {};
    },
    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },
    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },
    agentConfig() {
      return this.value.agentConfig;
    },
    advancedTitleAlt() {
      const machineSelectorLength = this.rkeConfig.machineSelectorConfig.length;

      return this.t('cluster.advanced.argInfo.machineSelector.titleAlt', { count: machineSelectorLength });
    },
    protectKernelDefaults() {
      return (this.agentConfig || this.serverConfig)['protect-kernel-defaults'];
    },
    kubeletArgTooltip() {
      if (this.serverConfig?.['kubelet-arg']) {
        return this.t(`cluster.advanced.argInfo.tooltip.${ this.agentConfig?.['kubelet-arg'] ? 'mixed-args' : 'global-args' }`, null, { raw: true });
      }

      return null;
    }
  },

  methods: {
    canRemoveKubeletRow(row, i) {
      return i !== 0 || !this.agentConfig;
    },
    showEmptyKubeletArg(config) {
      return !this.serverArgs?.['kubelet-arg']?.length && !config?.['kubelet-arg']?.length;
    },
    onInputProtectKernelDefaults(value) {
      if (this.agentConfig && this.agentConfig['protect-kernel-defaults'] !== undefined ) {
        this.agentConfig['protect-kernel-defaults'] = value;
      } else {
        this.serverConfig['protect-kernel-defaults'] = value;
      }
    }
  }
};
</script>

<template>
  <div>
    <Banner
      class="mt-0"
      color="info"
      label-key="cluster.jwtAuthentication.banner"
      data-testid="jwt-authentication-banner"
    />
    <template v-if="haveArgInfo">
      <DirectoryConfig
        v-model:value="value.spec.rkeConfig.dataDirectories"
        :k8s-version="value.spec.kubernetesVersion"
        :mode="mode"
      />
      <h3>{{ t('cluster.advanced.argInfo.title') }}</h3>
      <ArrayListGrouped
        v-if="agentArgs['kubelet-arg']"
        v-model:value="rkeConfig.machineSelectorConfig"
        class="mb-20"
        :mode="mode"
        :add-label="t('cluster.advanced.argInfo.machineSelector.label')"
        :can-remove="canRemoveKubeletRow"
        :default-add-value="{machineLabelSelector: { matchExpressions: [], matchLabels: {} }, config: {'kubelet-arg': []}}"
      >
        <template #default="{row, i}">
          <template v-if="row.value.machineLabelSelector">
            <h3>{{ t('cluster.advanced.argInfo.machineSelector.title') }}</h3>
            <MatchExpressions
              v-model:value="row.value.machineLabelSelector"
              class="mb-20"
              :mode="mode"
              :show-remove="false"
              :initial-empty-row="true"
            />
            <h3>{{ t('cluster.advanced.argInfo.machineSelector.subTitle') }}</h3>
          </template>
          <h3 v-else>
            {{ advancedTitleAlt }}
            <i
              v-if="kubeletArgTooltip"
              v-clean-tooltip="kubeletArgTooltip"
              class="icon icon-info"
            />
          </h3>

          <ArrayList
            v-if="i === 0 && serverConfig['kubelet-arg']"
            v-model:value="serverConfig['kubelet-arg']"
            class="mb-10"
            data-testid="global-kubelet-arg"
            :mode="mode"
            :add-label="t('cluster.advanced.argInfo.machineGlobal.listLabel')"
          >
            <template #empty>
              {{ '' }}
            </template>
          </ArrayList>

          <ArrayList
            v-if="row.value.config && (row.value.config['kubelet-arg'] || !serverConfig['kubelet-arg'])"
            v-model:value="row.value.config['kubelet-arg']"
            data-testid="selector-kubelet-arg"
            :mode="mode"
            :add-label="t('cluster.advanced.argInfo.machineSelector.listLabel')"
            :initial-empty-row="!!row.value.machineLabelSelector"
          >
            <template
              v-if="i === 0"
              #empty
            >
              {{ '' }}
            </template>
          </ArrayList>

          <div
            v-if="i === 0 && isView && showEmptyKubeletArg(row.value.config)"
            class="text-muted"
          >
            &mdash;
          </div>
        </template>
      </ArrayListGrouped>
      <Banner
        v-if="rkeConfig.machineSelectorConfig.length > 1"
        color="info"
        :label="t('cluster.advanced.argInfo.machineSelector.bannerLabel')"
      />

      <ArrayList
        v-if="serverArgs['kube-controller-manager-arg']"
        v-model:value="serverConfig['kube-controller-manager-arg']"
        :mode="mode"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeControllerManagerTitle')"
        class="mb-20"
      />
      <ArrayList
        v-if="serverArgs['kube-apiserver-arg']"
        v-model:value="serverConfig['kube-apiserver-arg']"
        :mode="mode"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeApiServerTitle')"
        class="mb-20"
      />
      <ArrayList
        v-if="serverArgs['kube-scheduler-arg']"
        v-model:value="serverConfig['kube-scheduler-arg']"
        :mode="mode"
        :title="t('cluster.advanced.argInfo.machineSelector.kubeSchedulerTitle')"
      />
    </template>
    <template v-if="agentArgs && agentArgs['protect-kernel-defaults']">
      <div class="spacer" />

      <div class="row">
        <div class="col span-12">
          <Checkbox
            data-testid="protect-kernel-defaults"
            :value="protectKernelDefaults"
            :mode="mode"
            :label="t('cluster.advanced.agentArgs.label')"
            @update:value="onInputProtectKernelDefaults($event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
