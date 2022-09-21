<script>
import { Banner } from '@components/Banner';
import InfoBox from '@shell/components/InfoBox';
import { Checkbox } from '@components/Form/Checkbox';
import CopyCode from '@shell/components/CopyCode';
import { LabeledInput } from '@components/Form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue';
import Taints from '@shell/components/form/Taints';
import { MANAGEMENT } from '@shell/config/types';

export default {
  components: {
    Banner, Checkbox, CopyCode, InfoBox, KeyValue, LabeledInput, Taints
  },

  props: {
    cluster: {
      type:     Object,
      required: true,
    },

    clusterToken: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
  },

  data() {
    return {
      showAdvanced:    false,
      etcd:            true,
      controlPlane:    true,
      worker:          true,
      insecure:        false,
      insecureWindows: false,
      address:         '',
      internalAddress: '',
      nodeName:        '',
      labels:          {},
      taints:          []
    };
  },

  computed: {
    linuxCommand() {
      const out = this.insecure ? [this.clusterToken.insecureNodeCommand] : [this.clusterToken.nodeCommand];

      this.etcd && out.push('--etcd');
      this.controlPlane && out.push('--controlplane');
      this.worker && out.push('--worker');
      this.address && out.push(`--address ${ sanitizeValue(this.address) }`);
      this.internalAddress && out.push(`--internal-address ${ sanitizeValue(this.internalAddress) }`);
      this.nodeName && out.push(`--node-name ${ sanitizeValue(this.nodeName) }`);

      for ( const key in this.labels ) {
        const k = sanitizeKey(key);
        const v = sanitizeValue(this.labels[k]);

        if ( k && v ) {
          out.push(`--label ${ k }=${ v }`);
        }
      }

      for ( const t of this.taints ) {
        const k = sanitizeKey(t.key);
        const v = sanitizeValue(t.value);
        const e = sanitizeValue(t.effect);

        if ( k && v && e ) {
          out.push(`--taints ${ k }=${ v }:${ e }`);
        }
      }

      return out.join(' ');
    },

    windowsCommand() {
      const out = this.insecureWindows ? [this.clusterToken.insecureWindowsNodeCommand] : [this.clusterToken.windowsNodeCommand];

      this.address && out.push(`-Address "${ sanitizeValue(this.address) }"`);
      this.internalAddress && out.push(`-InternalAddress "${ sanitizeValue(this.internalAddress) }"`);
      this.nodeName && out.push(`-NodeName "${ sanitizeValue(this.nodeName) }"`);

      for ( const key in this.labels ) {
        const k = sanitizeKey(key);
        const v = sanitizeValue(this.labels[k]);

        if ( k && v ) {
          out.push(`-Label "${ k }=${ v }"`);
        }
      }

      for ( const t of this.taints ) {
        const k = sanitizeKey(t.key);
        const v = sanitizeValue(t.value);
        const e = sanitizeValue(t.effect);

        if ( k && v && e ) {
          out.push(`-Taint "${ k }=${ v }:${ e }"`);
        }
      }

      return out.join(' ');
    },

    // Clusters need linux nodes with etcd, controlplane, and worker roles before windows nodes can be registration
    readyForWindows() {
      if (!this.cluster.mgmt || !this.cluster.mgmt.isReady) {
        return false;
      }
      const nodes = this.cluster.nodes || [];

      const allRoles = nodes.reduce((all, node) => {
        const { isWorker, isEtcd, isControlPlane } = node;

        if (isWorker && !all.includes('worker')) {
          all.push('worker');
        }
        if (isEtcd && !all.includes('etcd')) {
          all.push('etcd');
        }
        if (isControlPlane && !all.includes('controlPlane')) {
          all.push('controlPlane');
        }

        return all;
      }, []);

      return allRoles.length === 3;
    }

  },

  methods: {
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    copiedWindows() {
      this.$emit('copied-windows');
    }
  },
};

function sanitizeKey(k) {
  return (k || '').replace(/[^a-z0-9./_-]/ig, '');
}

function sanitizeValue(v) {
  return (v || '').replace(/[^a-z0-9._-]/ig, '');
}
</script>

<template>
  <div>
    <InfoBox :step="1" class="step-box">
      <h3 v-t="'cluster.custom.nodeRole.label'" />
      <h4 v-t="'cluster.custom.nodeRole.detail'" />
      <Checkbox v-model="etcd" label-key="model.machine.role.etcd" />
      <Checkbox v-model="controlPlane" label-key="model.machine.role.controlPlane" />
      <Checkbox v-model="worker" label-key="model.machine.role.worker" />
    </InfoBox>

    <InfoBox v-if="showAdvanced" :step="2" class="step-box">
      <h3 v-t="'cluster.custom.advanced.label'" />
      <h4 v-t="'cluster.custom.advanced.detail'" />

      <div class="row mb-10">
        <div class="col span-4">
          <LabeledInput v-model="nodeName" label-key="cluster.custom.advanced.nodeName" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="address" label-key="cluster.custom.advanced.publicIp" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="internalAddress" label-key="cluster.custom.advanced.privateIp" />
        </div>
      </div>

      <KeyValue
        v-model="labels"
        class="mb-10"
        mode="edit"
        :title="t('cluster.custom.advanced.nodeLabel.title')"
        :add-label="t('cluster.custom.advanced.nodeLabel.label')"
        :read-allowed="false"
      />

      <Taints v-model="taints" class="mb-10" mode="edit" :value="taints" />

      <a v-t="'generic.hideAdvanced'" @click="toggleAdvanced" />
    </InfoBox>

    <div v-else class="mb-20">
      <a v-t="'generic.showAdvanced'" @click="toggleAdvanced" />
    </div>

    <InfoBox :step="showAdvanced ? 3 : 2" class="step-box">
      <h3 v-t="'cluster.custom.registrationCommand.label'" />
      <h4 v-t="'cluster.custom.registrationCommand.linuxDetail'" />
      <CopyCode
        id="copiedLinux"
        class="m-10 p-10"
      >
        {{ linuxCommand }}
      </CopyCode>
      <Checkbox v-if="clusterToken.insecureNodeCommand" v-model="insecure" label-key="cluster.custom.registrationCommand.insecure" />

      <template v-if="cluster.supportsWindows">
        <hr class="mt-20 mb-20" />
        <h4 v-t="'cluster.custom.registrationCommand.windowsDetail'" />
        <Banner
          v-if="cluster.isRke1"
          color="warning"
          :label="t('cluster.custom.registrationCommand.windowsDeprecatedForRKE1')"
        />
        <template v-if="readyForWindows">
          <CopyCode
            id="copiedWindows"
            class="m-10 p-10"
            @copied="copiedWindows"
          >
            {{ windowsCommand }}
          </CopyCode>
          <Checkbox
            v-if="clusterToken.insecureWindowsNodeCommand"
            v-model="insecureWindows"
            label-key="cluster.custom.registrationCommand.insecure"
          />
          <Banner
            color="info"
            :label="t('cluster.custom.registrationCommand.windowsWarning')"
          />
        </template>
        <Banner
          v-else
          color="info"
          :label="t('cluster.custom.registrationCommand.windowsNotReady')"
        />
      </template>
    </InfoBox>
  </div>
</template>
