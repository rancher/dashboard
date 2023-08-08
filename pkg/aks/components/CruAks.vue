<script lang='ts'>
import Vue, { defineComponent } from 'vue';

import semver from 'semver';

import { addParams, QueryParams } from '@shell/utils/url';
import { randomStr } from '@shell/utils/string';
import { removeObject } from '@shell/utils/array';
import { _CREATE } from '@shell/config/query-params';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import type { AKSDiskType, AKSNodePool, AKSPoolMode } from '../types/index';
import { MANAGEMENT } from 'config/types';
import { SETTING } from 'config/settings';

const defaultNodePool = {
  availabilityZones:   ['1', '2', '3'],
  count:               1,
  enableAutoScaling:   false,
  maxPods:             110,
  maxSurge:            '1',
  mode:                'User' as AKSPoolMode,
  name:                'agentpool',
  nodeLabels:          { },
  nodeTaints:          [],
  orchestratorVersion: '',
  osDiskSizeGB:        128,
  osDiskType:          'Managed' as AKSDiskType,
  osType:              'Linux',
  // type:                'aksnodepool',
  vmSize:              '',
  isNew:               true,
};

export default defineComponent({
  name: 'CruAKS',

  components: {
    SelectCredential,
    CruResource,
    LabeledSelect,
    AksNodePool,
    LabeledInput,
    Checkbox,
    FileSelector,
    KeyValue
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const supportedVersionRange = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    // todo nb wire into value
    const config: any = {};

    return {
      credentialId: '',
      region:       '',
      aksVersion:   '',
      // todo nb wire into config
      nodePools:    [] as AKSNodePool[],
      config,

      supportedVersionRange,
      locationOptions: [],
      allAksVersions:  [],
      vmSizeOptions:   [],
      defaultVmSize:   '',
      // TODO nb on edit
      clusterId:       null,

      loadingLocations:    false,
      loadingVersions:     false,
      loadingVmSizes:      false,
      containerMonitoring: (config.logAnalyticsWorkspaceGroup || config.logAnalyticsWorkspaceName)

    };
  },
  computed: {
    doneRoute() {
      return this.value?.listLocation?.name;
    },
    showForm() {
      return this.credentialId;
    },

    aksVersionOptions() {
      return this.supportedVersionRange ? this.allAksVersions.filter((v) => semver.satisfies(v, this.supportedVersionRange)) : this.allAksVersions;
    },
  },

  watch: {
    credentialId(neu, old) {
      if (neu) {
        this.getLocations();
      }
    },

    region(neu) {
      if (neu && neu.length) {
        this.getAksVersions();
        this.getVmSizes();
      }
    }
  },

  methods: {
    aksUrlFor(path: string, useRegion = true): string | null {
      if (!this.credentialId) {
        return null;
      }
      const params: QueryParams = { cloudCredentialId: this.credentialId };

      if (useRegion) {
        params.region = this.region;
      }
      if (this.clusterId) {
        params.clusterId = this.clusterId;
      }

      return addParams(`/meta/${ path }`, params );
    },

    getLocations() {
      this.loadingLocations = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksLocations', false) }).then((res) => {
        console.log('aks regions: ', res);
        this.locationOptions = res;
        this.loadingLocations = false;
      }).catch((err) => {
        // TODO nb something
        console.error(err);
      });
    },

    getAksVersions() {
      this.loadingVersions = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVersions') }).then((res) => {
        console.log('aks k8s versions: ', res);

        // TODO more reliable way to sort versions?
        this.allAksVersions = res.reverse();

        this.aksVersion = this.aksVersionOptions[0];
        this.loadingVersions = false;
      }).catch((err) => {
        // TODO nb something
        console.error(err);
      });
    },

    getVmSizes() {
      this.loadingVmSizes = true;
      this.$store.dispatch('cluster/request', { url: this.aksUrlFor('aksVMSizes') }).then((res) => {
        console.log('aks vm sizes: ', res);

        this.vmSizeOptions = res;
        // todo nb more intelligent default size
        this.defaultPoolSize = this.vmSizeOptions[0];
        this.loadingVmSizes = false;
      }).catch((err) => {
        // TODO nb something
        console.error(err);
      });
    },

    addPool() {
      let poolName = `pool${ this.nodePools.length }`;
      let mode: AKSPoolMode = 'User';

      if (!this.nodePools.length) {
        poolName = 'agentPool';
        mode = 'System' as AKSPoolMode;
      }

      // TODO nb default size
      this.nodePools.push({
        ...defaultNodePool, name: poolName, _id: randomStr(), mode, vmSize: this.defaultVmSize
      });
    },

    removePool(pool: AKSNodePool) {
      removeObject(this.nodePools, pool);
    }
  },

});
</script>

<template>
  <CruResource
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    @error="e=>errors=e"
  >
    <div class="mb-20">
      <SelectCredential
        v-model="credentialId"
        :mode="mode"
        provider="azure"
        :default-on-cancel="true"
        :showing-form="true"
        class="mt-20"
      />
    </div>
    <div v-if="showForm">
      <!-- //TODO member roles from rke2 components
      //TODO labels/annotations from rke2 component
      //TODO Namensdescription -->
      <div class="row mb-10">
        <div
          v-if="locationOptions.length"
          class="col span-4"
        >
          <LabeledSelect
            v-model="region"
            :mode="mode"
            :options="locationOptions"
            option-label="displayName"
            option-key="name"
            label="Location"
            :reduce="opt=>opt.name"
            :loading="loadingLocations"
            required
          />
        </div>
      </div>

      <template v-if="region && region.length">
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledSelect
              v-model="aksVersion"
              :mode="mode"
              :options="aksVersionOptions"
              label="Kubernetes Version"
              :loading="loadingVersions"
              required
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.linuxAdminUsername"
              :mode="mode"
              label="linux admin username"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <LabeledInput
              v-model="config.resourceGroup"
              :mode="mode"
              label="cluster resource group"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="config.nodeResourceGroup"
              :mode="mode"
              label="node resource group"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-4">
            <Checkbox
              v-model="containerMonitoring"
              :mode="mode"
              label="configure container monitoring"
            />
          </div>
          <template v-if="containerMonitoring">
            <div class="col span-4">
              <LabeledInput
                v-model="config.logAnalyticsWorkspaceGroup"
                :mode="mode"
                label="log analytics workspace resource group"
              />
            </div>
            <div class="col span-4">
              <LabeledInput
                v-model="config.logAnalyticsWorkspaceName"
                :mode="mode"
                label="log analytics workspace name"
              />
            </div>
          </template>
        </div>
        <div class="row mb-10">
          <div class="col span-6">
            <FileSelector
              v-model="config.sshPublicKey"
              :mode="mode"
              label="upload ssh public key"
              class="role-tertiary"
            />
          </div>
        </div>

        <div
          v-for="(pool, i) in nodePools"
          :key="pool._id"
          class="mb-10"
        >
          <AksNodePool
            :mode="mode"
            :region="region"
            :pool="pool"
            :vm-size-options="vmSizeOptions"
            :loading-vm-sizes="loadingVmSizes"
            :isPrimaryPool="i===0"
            @remove="removePool(pool)"
          />
        </div>
        <div>
          <button
            type="button"
            class="btn role-tertiary"
            @click="addPool"
          >
            add node pool
          </button>
        </div>
      </template>
    </div>
  </CruResource>
</template>
