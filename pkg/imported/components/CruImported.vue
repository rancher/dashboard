<script>
import { set } from '@shell/utils/object';
import { mapGetters } from 'vuex';
import { defineComponent } from 'vue';
import { allHash } from '@shell/utils/promise';
import isEmpty from 'lodash/isEmpty';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import Labels from '@shell/components/form/Labels.vue';
import Basics from '@pkg/imported/components/Basics.vue';
import ACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE';
import { MANAGEMENT } from '@shell/config/types';
import KeyValue from '@shell/components/form/KeyValue';

export default defineComponent({
  name: 'CruImported',

  components: {
    Basics, ACE, Loading, CruResource, KeyValue, LabeledInput, Accordion, Banner, ClusterMembershipEditor, Labels
  },

  mixins: [CreateEditView, FormValidation],

  props: {

    mode: {
      type:    String,
      default: _CREATE
    },

    // provisioning cluster object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    const store = this.$store;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
      this.config = this.normanCluster.rke2Config || this.normanCluster.k3sConfig;
      if ( this.normanCluster && isEmpty(this.normanCluster.localClusterAuthEndpoint) ) {
        set(this.normanCluster, 'localClusterAuthEndpoint', { enabled: false });
      }
      if ( this.normanCluster && !this.normanCluster?.agentEnvVars) {
        this.normanCluster.agentEnvVars = [];
      }
      this.getVersions();
    }
  },

  data() {
    return {
      normanCluster:    { name: '' },
      loadingVersions:  false,
      membershipUpdate: {},
      config:           {},
      allVersions:      [],
      defaultVer:       '',
      fvFormRuleSets:   [{
        path:  'workerConcurrency',
        rules: ['workerConcurrencyRule']
      },
      {
        path:  'controlPlaneConcurrency',
        rules: ['controlPlaneConcurrencyRule']
      },

      ],
    };
  },

  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    fvExtraRules() {
      return {
        workerConcurrencyRule: () => {
          const val = this?.normanCluster?.k3sConfig?.k3supgradeStrategy?.workerConcurrency || this?.normanCluster?.rke2Config?.rke2upgradeStrategy?.workerConcurrency || '';
          const exists = this?.normanCluster?.k3sConfig?.k3supgradeStrategy || this?.normanCluster?.rke2Config?.rke2upgradeStrategy;
          // BE is only checking that the value is an integer >= 1
          const valIsInvalid = Number(val) < 1 || !Number.isInteger(+val) || `${ val }`.match(/\.+/g);

          return !!exists && valIsInvalid ? this.t('imported.errors.concurrency', { key: 'Worker Concurrency' }) : undefined ;
        },
        controlPlaneConcurrencyRule: () => {
          const val = this?.normanCluster?.k3sConfig?.k3supgradeStrategy?.serverConcurrency || this?.normanCluster?.rke2Config?.rke2upgradeStrategy?.serverConcurrency || '';
          const exists = this?.normanCluster?.k3sConfig?.k3supgradeStrategy || this?.normanCluster?.rke2Config?.rke2upgradeStrategy;
          // BE is only checking that the value is an integer >= 1
          const valIsInvalid = Number(val) < 1 || !Number.isInteger(+val) || `${ val }`.match(/\.+/g);

          return !!exists && valIsInvalid ? this.t('imported.errors.concurrency', { key: 'Control Plane Concurrency' }) : undefined ;
        },
      };
    },

    isEdit() {
      return this.mode === _CREATE || this.mode === _EDIT;
    },
    isK3s() {
      return !!this.normanCluster.k3sConfig;
    },
    isLocal() {
      return !!this.value.isLocal;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    providerTabKey() {
      return this.isK3s ? this.t('imported.accordions.k3sOptions') : this.t('imported.accordions.rke2Options');
    }
  },

  methods: {

    onMembershipUpdate(update) {
      this.membershipUpdate = update;
    },
    async saveRoleBindings() {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },
    async actuallySave() {
      return await this.normanCluster.save();
    },

    async getVersions() {
      this.loadingVersions = true;
      this.versionOptions = [];

      try {
        const globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING) || [];
        let hash = {};

        if (this.isK3s) {
          hash = { versions: this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }) };

          const defaultK3sSetting = globalSettings.find((setting) => setting.id === 'k3s-default-version') || {};

          this.defaultVersion = defaultK3sSetting?.value || defaultK3sSetting?.default;

          // Use the channel if we can not get the version from the settings
          if (!this.defaultVersion) {
            hash.channels = this.$store.dispatch('management/request', { url: '/v1-k3s-release/channels' });
          }
        } else {
          hash = { versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }) };

          const defaultRke2Setting = globalSettings.find((setting) => setting.id === 'rke2-default-version') || {};

          this.defaultVersion = defaultRke2Setting?.value || defaultRke2Setting?.default;

          if (!this.defaultVersion) {
            hash.channels = this.$store.dispatch('management/request', { url: '/v1-rke2-release/channels' });
          }
        }
        const res = await allHash(hash);

        this.allVersions = res.versions?.data || [];
        if (!this.defaultVersion) {
          const channels = res.channels?.data || [];

          this.defaultVersion = channels.find((x) => x.id === 'default')?.latest;
        }

        this.loadingVersions = false;
      } catch (err) {
        this.loadingVersions = false;
        const errors = this.errors;

        errors.push(this.t('imported.errors.kubernetesVersions', { e: err.error || err }));
      }
    },

    kubernetesVersionChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.kubernetesVersion = val;
      } else {
        this.normanCluster.k3sConfig.kubernetesVersion = val;
      }
    },
    drainServerNodesChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.rke2upgradeStrategy.drainServerNodes = val;
      } else {
        this.normanCluster.k3sConfig.k3supgradeStrategy.drainServerNodes = val;
      }
    },
    drainWorkerNodesChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.rke2upgradeStrategy.drainWorkerNodes = val;
      } else {
        this.normanCluster.k3sConfig.k3supgradeStrategy.drainWorkerNodes = val;
      }
    },
    serverConcurrencyChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.rke2upgradeStrategy.serverConcurrency = val;
      } else {
        this.normanCluster.k3sConfig.k3supgradeStrategy.serverConcurrency = val;
      }
    },
    workerConcurrencyChanged(val) {
      if ( !this.isK3s ) {
        this.normanCluster.rke2Config.rke2upgradeStrategy.workerConcurrency = val;
      } else {
        this.normanCluster.k3sConfig.k3supgradeStrategy.workerConcurrency = val;
      }
    },
    enableLocalClusterAuthEndpoint(neu) {
      this.normanCluster.localClusterAuthEndpoint.enabled = neu;
      if (!!neu) {
        this.normanCluster.localClusterAuthEndpoint.caCerts = '';
        this.normanCluster.localClusterAuthEndpoint.fqdn = '';
      } else {
        delete this.normanCluster.localClusterAuthEndpoint.caCerts;
        delete this.normanCluster.localClusterAuthEndpoint.fqdn;
      }
    },
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
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
  >
    <Loading
      v-if="$fetchState.pending"
      mode="relative"
    />
    <div v-else>
      <div class="mt-10">
        <div class="row mb-10">
          <div class="col span-3">
            <LabeledInput
              v-model:value="normanCluster.name"
              :mode="mode"
              :disabled="true"
              label-key="generic.name"
              data-testid="imported-name"
            />
          </div>
          <div
            v-if="isLocal"
            class="col span-3"
          >
            <LabeledInput
              v-model:value="normanCluster.description"
              :mode="mode"
              label-key="nameNsDescription.description.label"
              :placeholder="t('nameNsDescription.description.placeholder')"
            />
          </div>
        </div>
      </div>
      <Accordion
        class="mb-20"
        :title="providerTabKey"
        :open-initially="true"
      >
        <Basics
          :value="normanCluster"
          :mode="mode"
          :config="config"
          :versions="allVersions"
          :default-version="defaultVersion"
          :loading-versions="loadingVersions"
          :rules="{workerConcurrency: fvGetAndReportPathRules('workerConcurrency'), controlPlaneConcurrency: fvGetAndReportPathRules('controlPlaneConcurrency') }"
          @kubernetes-version-changed="kubernetesVersionChanged"
          @drain-server-nodes-changed="drainServerNodesChanged"
          @drain-worker-nodes-changed="drainWorkerNodesChanged"
          @server-concurrency-changed="serverConcurrencyChanged"
          @worker-concurrency-changed="workerConcurrencyChanged"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        title-key="imported.accordions.clusterMembers"
        :open-initially="true"
      >
        <Banner
          v-if="isEdit"
          color="info"
        >
          {{ t('cluster.memberRoles.removeMessage') }}
        </Banner>
        <ClusterMembershipEditor
          v-if="canManageMembers"
          :mode="mode"
          :parent-id="normanCluster.id ? normanCluster.id : null"
          @membership-update="onMembershipUpdate"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        title-key="imported.accordions.labels"
        :open-initially="true"
      >
        <Labels
          v-model:value="normanCluster"
          :mode="mode"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        title-key="imported.accordions.networking"
        :open-initially="true"
      >
        <ACE
          v-model:value="normanCluster.localClusterAuthEndpoint"
          :mode="mode"
          @local-cluster-auth-endpoint-changed="enableLocalClusterAuthEndpoint"
          @ca-certs-changed="(val)=>normanCluster.localClusterAuthEndpoint.caCerts = val"
          @fqdn-changed="(val)=>normanCluster.localClusterAuthEndpoint.fqdn = val"
        />
      </Accordion>
      <Accordion
        v-if="isK3s"
        class="mb-20"
        title-key="imported.accordions.advanced"
        :open-initially="false"
      >
        <h3>{{ t('imported.agentEnv.header') }}</h3>
        <KeyValue
          v-model:value="normanCluster.agentEnvVars"
          :mode="mode"
          key-name="name"
          :as-map="false"
          :preserve-keys="['valueFrom']"
          :supported="(row) => typeof row.valueFrom === 'undefined'"
          :read-allowed="true"
          :value-can-be-empty="true"
          :key-label="t('cluster.agentEnvVars.keyLabel')"
          :parse-lines-from-file="true"
        />
      </Accordion>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
</style>
