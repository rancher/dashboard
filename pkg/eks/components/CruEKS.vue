<script lang='ts'>
import semver from 'semver';
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';

import AccountAccess from './AccountAccess.vue';

import { randomStr } from '@shell/utils/string';
import { isArray, removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { SETTING } from '@shell/config/settings';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import { RadioGroup } from '@components/Form/Radio';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';

import { EKSConfig, EKSNodeGroup } from '../types';
import NodeGroup from './NodeGroup.vue';
import Logging from './Logging.vue';
import Config from './Config.vue';
import Networking from './Networking.vue';

const defaultCluster = {
  dockerRootDir:           '/var/lib/docker',
  enableClusterAlerting:   false,
  enableClusterMonitoring: false,
  enableNetworkPolicy:     false,
  labels:                  {},
  windowsPreferedCluster:  false,
};

// todo nb should this  be placeholder instead?
// TODO nb move to node group
const DEFAULT_USER_DATA =
`MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
echo "Running custom user data script"

--==MYBOUNDARY==--\\`;

const DEFAULT_NODE_GROUP_CONFIG = {
  desiredSize:          2,
  diskSize:             20,
  ec2SshKey:            '',
  gpu:                  false,
  imageId:              null,
  instanceType:         't3.medium',
  labels:               {},
  // launchTemplate:       {},
  maxSize:              2,
  minSize:              2,
  nodegroupName:        '',
  nodeRole:             '',
  requestSpotInstances: false,
  resourceTags:         {},
  spotInstanceTypes:    [],
  subnets:              [],
  tags:                 {},
  type:                 'nodeGroup',
  userData:             DEFAULT_USER_DATA,
};

export const DEFAULT_REGION = 'us-west-2';

// const _NONE = 'none';

export default defineComponent({
  name: 'CruEKS',

  components: {
    CruResource,
    AccountAccess,
    LabeledSelect,
    RadioGroup,
    NodeGroup,
    Logging,
    Config,
    Checkbox,
    Networking,
    LabeledInput,
    // Checkbox,
    // FileSelector,
    // KeyValue,
    // ArrayList,
    ClusterMembershipEditor,
    // Labels,
    Tabbed,
    Tab,
    Accordion,
    Banner
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // v2 provisioning cluster object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  // AKS provisioning needs to use the norman API - a provisioning cluster resource will be created by the BE when the norman cluster is made but v2 prov clusters don't contain the relevant aks configuration fields
  async fetch() {
    const store = this.$store as Store<any>;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
      // track original version on edit to ensure we don't offer k8s downgrades
      this.originalVersion = this.normanCluster?.eksConfig?.kubernetesVersion;
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
    }

    if (!this.normanCluster.eksConfig) {
      this.$set(this.normanCluster, 'eksConfig', { publicAccess: false });
    }

    // TODO nb do this better?
    // TODO nb defaults
    this.config = this.normanCluster.eksConfig;

    if (!this.config.nodeGroups || !this.config.nodeGroups.length) {
      this.$set(this.config, 'nodeGroups', [{ ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: 'group1' }]);
    }
    this.nodeGroups = this.config.nodeGroups;
  },

  data() {
    const store = this.$store as Store<any>;

    const t = store.getters['i18n/t'];

    return {
      cloudCredentialId: '',
      normanCluster:     { name: '' } as any,
      nodeGroups:        [] as EKSNodeGroup[],
      config:            { } as EKSConfig,
      membershipUpdate:  {} as any,
      originalVersion:   '',
      // fvFormRuleSets:        [],
      // TODO nb default from config
      customServiceRole: false,

      serviceRoleOptions:     [{ value: false, label: 'Standard: A service role will be automatically created' }, { value: true, label: 'Custom: Choose from an existing service role' }],
      // todo nb spinners in node ggroup component
      loadingInstanceTypes:   false,
      loadingLaunchTemplates: false,

      loadingIam:      false,
      iamInfo:         {} as any,
      ec2Roles:        [],
      eksRoles:        [],
      instanceTypes:   [],
      launchTemplates: []
    };
  },

  created() {
    const registerAfterHook = this.registerAfterHook as Function;

    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  watch: {
    'iamInfo'(neu: any) {
      const ec2Roles = [] as any[];
      const eksRoles = [] as any[];
      const allRoles = neu?.Roles;

      allRoles.forEach((role:any) => {
        const policy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
        const statement = policy.Statement;

        statement.forEach( (doc: any) => {
          const principal = doc.Principal;

          if (principal) {
            const service = principal.Service;

            if (service && service.includes('ec2.amazonaws.com') && !ec2Roles.find((r) => r.RoleId === role.RoleId) && !role.RoleName.match(/^rancher-managed/)) {
              ec2Roles.push(role);
            }
            if ( service && ( service.includes('eks.amazonaws') || service.includes('EKS') ) && !eksRoles.find((r) => r.RoleId === role.RoleId)) {
              eksRoles.push(role);
            } else if (principal.EKS) {
              eksRoles.push(role);
            }
          }
        });
      });

      this.ec2Roles = ec2Roles;
      this.eksRoles = eksRoles;
      this.loadingIam = false;
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    // fvExtraRules() {
    //   return {};
    // },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned() {
      return this.mode === _CREATE || !this.normanCluster?.eksStatus?.upstreamSpec;
    },

    isEdit() {
      return this.mode === _CREATE || this.mode === _EDIT;
    },

    doneRoute() {
      return this.value?.listLocation?.name;
    },

    hasCredential() {
      return !!this.config?.amazonCredentialSecret;
    },

    clusterId(): String | null {
      return this.value?.id || null;
    },

    canManageMembers(): Boolean {
      return canViewClusterMembershipEditor(this.$store);
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

    // TODO nb show more info about instance types in dropdown
    instanceTypeOptions() {
      return this.instanceTypes.map((type: any) => type.apiName);
    },
  },

  methods: {

    setClusterName(name: string): void {
      this.$set(this.normanCluster, 'name', name);
      this.$set(this.config, 'clusterName', name);
    },

    onMembershipUpdate(update: any): void {
      this.$set(this, 'membershipUpdate', update);
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // these fields are used purely in UI, to track individual nodepool components
    cleanPoolsForSave(): void {
      // this.nodeGroups.forEach((pool: AKSNodePool) => {
      //   Object.keys(pool).forEach((key: string) => {
      //     if (key.startsWith('_')) {
      //       delete pool[key as keyof AKSNodePool];
      //     }
      //   });
      // });
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields(): void {
      // const upstreamConfig = this.normanCluster?.status?.eksStatus?.upstreamSpec;

      // if (upstreamConfig) {
      //   const diff = diffUpstreamSpec(upstreamConfig, this.config);

      //   this.$set(this.normanCluster, 'eksConfig', diff);
      // }
    },

    async actuallySave(): Promise<void> {
      await this.normanCluster.save();

      return await this.normanCluster.waitForCondition('InitialRolesPopulated');
    },

    // fires when the 'cancel' button is pressed while the user is creating a new cloud credential
    cancelCredential(): void {
      if ( this.$refs.cruresource ) {
        (this.$refs.cruresource as any).emitOrRoute();
      }
    },

    updateRegion(e: string) {
      // TODO nb group aws calls & clear their errors
      this.$set(this.config, 'region', e);
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
    },

    updateCredential(e: any) {
      this.$set(this.config, 'amazonCredentialSecret', e);
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
    },

    // TODO nb warn if 0 groups
    removeGroup(i: number) {
      const group = this.nodeGroups[i];

      removeObject(this.nodeGroups, group);
    },

    addGroup() {
      let nextDefaultSuffix = this.nodeGroups.length + 1;

      while (this.nodeGroups.find((group) => group.nodegroupName === `group${ nextDefaultSuffix }`)) {
        nextDefaultSuffix++;
      }
      this.nodeGroups.push({ ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: `group${ nextDefaultSuffix }` });
    },

    async fetchInstanceTypes() {
      const store = this.$store as Store<any>;

      if (!this.config.region || !this.config.amazonCredentialSecret) {
        return;
      }
      this.loadingInstanceTypes = true;
      try {
        const ec2Client = await store.dispatch('aws/ec2', { region: this.config.region, cloudCredentialId: this.config.amazonCredentialSecret });

        this.instanceTypes = await store.dispatch('aws/instanceInfo', { client: ec2Client });
      } catch {}
      this.loadingInstanceTypes = false;
    },

    async fetchLaunchTemplates() {
      const store = this.$store as Store<any>;

      if (!this.config.region || !this.config.amazonCredentialSecret) {
        return;
      }
      this.loadingLaunchTemplates = true;
      try {
        const ec2Client = await store.dispatch('aws/ec2', { region: this.config.region, cloudCredentialId: this.config.amazonCredentialSecret });

        const launchTemplateInfo = await ec2Client.describeLaunchTemplates({ DryRun: false });

        this.launchTemplates = launchTemplateInfo.LaunchTemplates;
      } catch (err) {
        this.errors.push(err);
      }
      this.loadingLaunchTemplates = false;
    },

    async fetchServiceRoles() {
      const { region, amazonCredentialSecret } = this.config;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      this.loadingIam = true;
      const store = this.$store as Store<any>;
      const iamClient = await store.dispatch('aws/iam', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        this.iamInfo = await iamClient.listRoles({});
      } catch (e) {
        this.errors.push(e);
      }
    }
  }

});
</script>

<template>
  <CruResource
    ref="cruresource"
    :resource="value"
    :mode="mode"
    :can-yaml="false"
    :done-route="doneRoute"
    :errors="fvUnreportedValidationErrors"
    :validation-passed="fvFormIsValid"
    @error="e=>errors=e"
    @finish="save"
    @cancel="done"
  >
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          required
          label="Cluster Name"
          :value="config.displayName"
          :mode="mode"
          @input="setClusterName"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="normanCluster.description"
          :mode="mode"
          label-key="nameNsDescription.description.label"
          :placeholder="t('nameNsDescription.description.placeholder')"
        />
      </div>
    </div>
    <!-- //TODO nb cluster name -->
    <AccountAccess
      :credential="config.amazonCredentialSecret"
      :mode="mode"
      :region="config.region"
      @cancel-credential="cancelCredential"
      @update-region="updateRegion"
      @update-credential="updateCredential"
      @error="e=>errors.push(e)"
    />
    <template v-if="hasCredential">
      <Accordion
        class="mb-20"
        title="Cluster Options"
        :open-initially="true"
      >
        <Config
          :mode="mode"
          :config="config"
          :eks-roles="eksRoles"
          :loading-iam="loadingIam"
          :kubernetes-version.sync="config.kubernetesVersion"
          :enable-network-policy.sync="config.enableNetworkPolicy"
          :ebs-c-s-i-driver.sync="config.ebsCSIDriver"
          :service-role.sync="config.serviceRole"
          :kms-key.sync="config.kmsKey"
          @error="e=>errors.push(e)"
        />
      </Accordion>
      <Tabbed
        class="mb-20"
        :side-tabs="true"
        :show-tabs-add-remove="mode !== 'view'"
        @removeTab="removeGroup($event)"
        @addTab="addGroup($event)"
      >
        <Tab
          v-for="(node, i) in nodeGroups"
          :key="i"
          :name="node.nodegroupName"
        >
          <NodeGroup
            :mode="mode"
            :node-role.sync="node.nodeRole"
            :launch-template.sync="node.launchTemplate"
            :nodegroup-name.sync="node.nodegroupName"
            :ec2-ssh-key.sync="node.ec2SshKey"
            :tags.sync="node.tags"
            :resource-tags.sync="node.resourceTags"
            :disk-size.sync="node.diskSize"
            :image-id.sync="node.imageId"
            :instance-type.sync="node.instanceType"
            :spot-instance-types.sync="node.spotInstanceTypes"
            :user-data.sync="node.userData"
            :gpu.sync="node.gpu"
            :desired-size.sync="node.desiredSize"
            :min-size.sync="node.minSize"
            :max-size.sync="node.maxSize"
            :request-spot-instances.sync="node.requestSpotInstances"
            :labels.sync="node.labels"
            :instance-type-options="instanceTypeOptions"
            :launch-templates="launchTemplates"
            :region="config.region"
            :amazon-credential-secret="config.amazonCredentialSecret"
            :is-new-or-unprovisioned="isNewOrUnprovisioned"
            :ec2-roles="ec2Roles"
          />
        </Tab>
      </Tabbed>

      <Accordion
        class="mb-20"
        title="Logging"
      >
        <!-- //TODO nb v-model? -->
        <Logging
          :mode="mode"
          :config="config"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        title="Networking"
      >
        <!-- //TODO nb v-model? -->
        <Networking
          :mode="mode"
          :region="config.region"
          :amazon-credential-secret="config.amazonCredentialSecret"
          :public-access.sync="config.publicAccess"
          :private-access.sync="config.privateAccess"
          :public-access-sources.sync="config.publicAccessSources"
          :subnets.sync="config.subnets"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        title="Cluster Agent Configuration"
      />
      <Accordion
        class="mb-20"
        title="Fleet Agent Configuration"
      />
      <Accordion
        class="mb-20"
        title="Cluster Membership"
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
        title="Labels and Annotations"
      />
    </template>
    <template
      v-if="!hasCredential"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
  .networking-checkboxes {
    display: flex;
    flex-direction: column;

    &>*{
      margin-bottom: 10px;
    }
  }

  .node-pool {
    padding: 10px;
  }

  .center-inputs {
    display: flex;
    align-items: center;
  }
</style>
