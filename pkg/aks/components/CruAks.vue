<script lang='ts'>
import Vue from 'vue';
import { addParams, QueryParams } from '@shell/utils/url';
import { randomStr } from '@shell/utils/string';
import { _CREATE } from '@shell/config/query-params';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import { removeObject } from 'utils/array';

const defaultNodePool = {
  availabilityZones:   [],
  count:               1,
  enableAutoScaling:   false,
  isNew:               true,
  maxPods:             110,
  maxSurge:            '1',
  mode:                'System',
  name:                'agentpool',
  nodeLabels:          { },
  nodeTaints:          [],
  orchestratorVersion: '',
  osDiskSizeGB:        128,
  osDiskType:          'Managed',
  osType:              'Linux',
  type:                'aksnodepool',
  vmSize:              '',
};

interface AKSNodePool {
  availabilityZones?: String[],
  count?: Number,
  enableAutoScaling?: Boolean,
  isNew?: Boolean,
  maxPods?: Number,
  maxSurge?: String,
  mode?: String, // TODO nb what are options here?
  name?: String,
  nodeLabels?: Object,
  nodeTaints?: any[], // TODO nb shape of node taints
  orchestratorVersion?: String,
  osDiskSizeGB?: Number,
  osDiskType?: String,
  osType?: String, // TODO nb ostype options
  type?: String, // TODO nb options
  vmSize?: String,
  _id?: String
}

export default Vue.extend({
  name: 'CruAKS',

  components: {
    SelectCredential,
    CruResource,
    LabeledSelect,
    AksNodePool
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
    return {
      credentialId: '',
      region:       '',
      aksVersion:   '',
      nodePools:    [] as AKSNodePool[],

      locationOptions:   [],
      aksVersionOptions: [],
      vmSizeOptions:     [],
      defaultVmSize:     '',
      // TODO nb on edit
      clusterId:         null,

      loadingLocations: false,
      loadingVersions:  false,
      loadingVmSizes:   false

    };
  },
  computed: {
    doneRoute() {
      return this.value?.listLocation?.name;
    },
    showForm() {
      return this.credentialId;
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
        // TODO do we support all versions returned here?
        this.aksVersionOptions = res.reverse();
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
        this.defaultPoolSize = this.vmSizeOptions[0];
        this.loadingVmSizes = false;
      }).catch((err) => {
        // TODO nb something
        console.error(err);
      });
    },

    addPool() {
      let poolName = `pool${ this.nodePools.length }`;

      if (!this.nodePools.length) {
        poolName = 'agentPool';
      }

      // TODO nb default size default name
      this.nodePools.push({
        ...defaultNodePool, name: poolName, _id: randomStr()
      });
    },

    // TODO nb pool interface
    removePool(pool: any) {
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
            :can-remove="i!==0"
            @remove="removePool(pool)"
          />
        </div>
        <div>
          <button
            type="button"
            class="btn role-primary"
            @click="addPool"
          >
            add node pool
          </button>
        </div>
      </template>
    </div>
  </CruResource>
</template>
