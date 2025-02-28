<script lang='ts'>
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

import { removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { diffUpstreamSpec, syncUpstreamConfig } from '@shell/utils/kontainer';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import CruResource from '@shell/components/CruResource.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue';
import Labels from '@shell/components/form/Labels.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Accordion from '@components/Accordion/Accordion.vue';
import Banner from '@components/Banner/Banner.vue';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import Loading from '@shell/components/Loading.vue';

import { EKSConfig, EKSNodeGroup, AWS, NormanCluster } from '../types';
import NodeGroup from './NodeGroup.vue';
import Logging from './Logging.vue';
import Config from './Config.vue';
import Networking from './Networking.vue';
import AccountAccess from './AccountAccess.vue';
import Import from './Import.vue';

import EKSValidators from '../util/validators';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';

const DEFAULT_CLUSTER = {
  dockerRootDir:                       '/var/lib/docker',
  enableClusterAlerting:               false,
  enableClusterMonitoring:             false,
  enableNetworkPolicy:                 false,
  labels:                              {},
  annotations:                         {},
  windowsPreferedCluster:              false,
  fleetAgentDeploymentCustomization:   {},
  clusterAgentDeploymentCustomization: {}
};

const DEFAULT__IMPORT_CLUSTER = {
  dockerRootDir:                       '/var/lib/docker',
  enableNetworkPolicy:                 false,
  labels:                              {},
  annotations:                         {},
  windowsPreferedCluster:              false,
  fleetAgentDeploymentCustomization:   {},
  clusterAgentDeploymentCustomization: {},
  eksConfig:                           {
    amazonCredentialSecret: '',
    displayName:            '',
    imported:               true,
    region:                 ''
  }
};

export const DEFAULT_REGION = 'us-west-2';

export const DEFAULT_NODE_GROUP_CONFIG = {
  desiredSize:          2,
  diskSize:             20,
  ec2SshKey:            '',
  gpu:                  false,
  imageId:              null,
  instanceType:         't3.medium',
  labels:               {},
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
  userData:             '',
  _isNew:               true,
};

export const DEFAULT_EKS_CONFIG = {
  publicAccess:        true,
  privateAccess:       false,
  publicAccessSources: [],
  secretsEncryption:   false,
  securityGroups:      [],
  tags:                {},
  subnets:             [],
  loggingTypes:        [],
};

export default defineComponent({
  name: 'CruEKS',

  components: {
    CruResource,
    AccountAccess,
    NodeGroup,
    Logging,
    Config,
    Networking,
    LabeledInput,
    ClusterMembershipEditor,
    Labels,
    Tabbed,
    Tab,
    Accordion,
    Banner,
    AgentConfiguration,
    Loading,
    Import
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

  async fetch() {
    const store = this.$store as Store<any>;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
      // ensure any fields editable through this UI that have been altered in aws are shown here - see syncUpstreamConfig jsdoc for details
      if (!this.isNewOrUnprovisioned) {
        syncUpstreamConfig('eks', this.normanCluster);
      }
      // track original version on edit to ensure we don't offer k8s downgrades
      this.originalVersion = this.normanCluster?.eksConfig?.kubernetesVersion || '';
    } else {
      if (this.isImport) {
        this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...cloneDeep(DEFAULT__IMPORT_CLUSTER) }, { root: true });
        this.config = this.normanCluster.eksConfig as EKSConfig;
      } else {
        this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...DEFAULT_CLUSTER }, { root: true });
      }
      if (!this.$store.getters['auth/principalId'].includes('local://')) {
        this.normanCluster.annotations[CREATOR_PRINCIPAL_ID] = this.$store.getters['auth/principalId'];
      }
    }

    if (!this.isImport) {
      if (!this.normanCluster.eksConfig) {
        this.normanCluster['eksConfig'] = { ...DEFAULT_EKS_CONFIG } as any as EKSConfig;
      }
      if (!this.normanCluster.fleetAgentDeploymentCustomization) {
        this.normanCluster['fleetAgentDeploymentCustomization'] = {};
      }
      if (!this.normanCluster.clusterAgentDeploymentCustomization) {
        this.normanCluster['clusterAgentDeploymentCustomization'] = {};
      }
      this.config = this.normanCluster.eksConfig as EKSConfig;

      if ((!this.config.nodeGroups || !this.config.nodeGroups.length) && this.mode === _CREATE) {
        this.config['nodeGroups'] = [{ ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: 'group1' }];
      }
      if (this.config.nodeGroups) {
        this.nodeGroups = this.config.nodeGroups;
      } else {
        this.config['nodeGroups'] = this.nodeGroups;
      }
    }
    if (this.mode !== _VIEW) {
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
      this.fetchSshKeys();
    }
  },

  data() {
    // if we are registering a new EKS cluster most of the form is hidden
    const isImport = this.$route?.query?.mode === 'import';

    return {
      isImport,
      cloudCredentialId: '',
      normanCluster:     { name: '' } as unknown as NormanCluster,
      nodeGroups:        [] as EKSNodeGroup[],
      config:            { } as EKSConfig,
      membershipUpdate:  {} as {newBindings: any[], removedBindings: any[], save: Function},
      originalVersion:   '',
      fvFormRuleSets:    isImport ? [{
        path:  'name',
        rules: ['nameRequired'],
      },
      // eks cluster name when choosing a cluster to register
      {
        path:  'displayName',
        rules: ['displayNameRequired'],
      }
      ] : [{
        path:  'name',
        rules: ['nameRequired'],
      },
      {
        path:  'nodegroupNames',
        rules: ['nodeGroupNamesRequired', 'nodeGroupNamesUnique']

      },
      {
        path:  'maxSize',
        rules: ['maxSize']
      },
      {
        path:  'minSize',
        rules: ['minSize']
      },
      {
        path:  'desiredSize',
        rules: ['desiredSize']
      },
      {
        path:  'subnets',
        rules: ['subnets']
      },
      {
        path:  'instanceType',
        rules: ['instanceType']
      },
      {
        path:  'diskSize',
        rules: ['diskSize']
      },
      {
        path:  'networking',
        rules: ['publicPrivateAccess']
      },
      {
        path:  'minMaxDesired',
        rules: ['minMaxDesired', 'minLessThanMax']
      },
      {
        path:  'nodeGroupsRequired',
        rules: ['nodeGroupsRequired']
      }
      ],

      loadingInstanceTypes:   false,
      loadingLaunchTemplates: false,
      loadingSshKeyPairs:     false,
      loadingIam:             false,
      iamInfo:                {} as {Roles: AWS.IamRole[]},
      ec2Roles:               [] as AWS.IamRole[],
      eksRoles:               [] as AWS.IamRole[],
      sshKeyPairs:            [] as string[],
      instanceTypes:          [],
      launchTemplates:        []
    };
  },

  created() {
    const registerAfterHook: Function = this.registerAfterHook;

    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  watch: {
    'iamInfo'(neu: {Roles: AWS.IamRole[]}) {
      const ec2Roles = [] as AWS.IamRole[];
      const eksRoles = [] as AWS.IamRole[];
      const allRoles = neu?.Roles;

      allRoles.forEach((role: AWS.IamRole) => {
        const policy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
        const statement = policy.Statement;

        statement.forEach( (doc: {Principal: {Service: string, EKS: boolean}}) => {
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

    'config.kubernetesVersion'(neu) {
      this.nodeGroups.forEach((group: EKSNodeGroup) => {
        if (group._isNew) {
          group['version'] = neu;
        }
      });
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    fetchState(): {pending: boolean} {
      return this.$fetchState;
    },

    fvExtraRules(): {[key:string]: Function} {
      let out: any = {};

      if (this.hasCredential) {
        out = {
          displayNameRequired:    EKSValidators.displayNameRequired(this),
          nameRequired:           EKSValidators.clusterNameRequired(this),
          nodeGroupNamesRequired: EKSValidators.nodeGroupNamesRequired(this),
          nodeGroupNamesUnique:   EKSValidators.nodeGroupNamesUnique(this),
          maxSize:                EKSValidators.maxSize(this),
          minSize:                EKSValidators.minSize(this),
          diskSize:               EKSValidators.diskSize(this),
          instanceType:           EKSValidators.instanceType(this),
          desiredSize:            EKSValidators.desiredSize(this),
          subnets:                EKSValidators.subnets(this),
          publicPrivateAccess:    EKSValidators.publicPrivateAccess(this),
          minMaxDesired:          EKSValidators.minMaxDesired(this),
          minLessThanMax:         EKSValidators.minLessThanMax(this),
        };
        if (!this.config?.imported) {
          out.nodeGroupsRequired = EKSValidators.nodeGroupsRequired(this);
        }
      }

      return out;
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned(): boolean {
      return this.mode === _CREATE || !this.normanCluster?.eksStatus?.upstreamSpec;
    },

    isEdit(): boolean {
      return this.mode === _CREATE || this.mode === _EDIT;
    },

    doneRoute(): string {
      return this.value?.listLocation?.name;
    },

    hasCredential(): boolean {
      return !!this.config?.amazonCredentialSecret;
    },

    clusterId(): string | null {
      return this.value?.id || null;
    },

    // used to display VPC/subnet information in the networking tab for imported clusters and clusters with the 'create a vpc and subnets automatically' option selected
    statusSubnets(): string[] {
      return this.normanCluster?.eksStatus?.subnets || [];
    },

    canManageMembers(): boolean {
      return canViewClusterMembershipEditor(this.$store);
    },

    CREATE(): string {
      return _CREATE;
    },

    VIEW(): string {
      return _VIEW;
    },

    groupedInstanceTypes(): {[key:string]: AWS.InstanceType[]} {
      const out: {[key:string]: AWS.InstanceType[]} = {};

      this.instanceTypes.forEach((type: AWS.InstanceType) => {
        if (out[type.groupLabel]) {
          out[type.groupLabel].push(type);
        } else {
          out[type.groupLabel] = [type];
        }
      });

      return out;
    },

    instanceTypeOptions(): AWS.InstanceTypeOption[] {
      const out: AWS.InstanceTypeOption[] = [];

      Object.keys(this.groupedInstanceTypes).forEach((groupLabel: string) => {
        const instances = this.groupedInstanceTypes[groupLabel];
        const groupOption = { label: groupLabel, kind: 'group' };
        const instanceTypeOptions = instances.map((instance: AWS.InstanceType) => {
          return {
            value: instance.apiName,
            label: instance.label,
            group: instance.groupLabel
          };
        });

        out.push(groupOption);
        out.push(...instanceTypeOptions);
      });

      return out;
    },

    spotInstanceTypeOptions(): AWS.InstanceTypeOption[] {
      const out: AWS.InstanceTypeOption[] = [];

      Object.keys(this.groupedInstanceTypes).forEach((groupLabel: string) => {
        const instances = this.groupedInstanceTypes[groupLabel];
        const groupOption = { label: groupLabel, kind: 'group' };
        const instanceTypeOptions = instances.reduce((spotInstances: AWS.InstanceTypeOption[], instance: AWS.InstanceType) => {
          if (!(instance.supportedUsageClasses || []).includes('spot')) {
            return spotInstances;
          }
          const opt = {
            value: instance.apiName,
            label: instance.label,
            group: instance.groupLabel
          };

          spotInstances.push(opt);

          return spotInstances;
        }, []);

        if (instanceTypeOptions.length) {
          out.push(groupOption);
          out.push(...instanceTypeOptions);
        }
      });

      return out;
    },
  },

  methods: {
    setClusterName(name: string): void {
      this.normanCluster['name'] = name;
      if (!this.isImport) {
        this.config['displayName'] = name;
      }
    },

    onMembershipUpdate(update: {newBindings: any[], removedBindings: any[], save: Function}): void {
      this['membershipUpdate'] = update;
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.eksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.normanCluster['eksConfig'] = diff;
      }
    },

    async actuallySave(): Promise<void> {
      if (!this.isNewOrUnprovisioned && !this.nodeGroups.length && !!this.normanCluster?.eksConfig?.nodeGroups) {
        this.normanCluster.eksConfig['nodeGroups'] = null;
      }
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
      this.config['region'] = e;
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
      this.fetchSshKeys();
    },

    updateCredential(e: string) {
      this.config['amazonCredentialSecret'] = e;
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
      this.fetchSshKeys();
    },

    removeGroup(i: number) {
      const group = this.nodeGroups[i];

      removeObject(this.nodeGroups, group);
    },

    addGroup() {
      let nextDefaultSuffix = this.nodeGroups.length + 1;

      while (this.nodeGroups.find((group) => group.nodegroupName === `group${ nextDefaultSuffix }`)) {
        nextDefaultSuffix++;
      }
      this.nodeGroups.push({
        ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: `group${ nextDefaultSuffix }`, version: this.config?.kubernetesVersion
      });
    },

    async fetchInstanceTypes() {
      const store = this.$store as Store<any>;

      if (!this.config.region || !this.config.amazonCredentialSecret) {
        return;
      }
      this.loadingInstanceTypes = true;
      try {
        const ec2Client = await store.dispatch('aws/ec2', { region: this.config.region, cloudCredentialId: this.config.amazonCredentialSecret });

        this.instanceTypes = await store.dispatch('aws/describeInstanceTypes', { client: ec2Client });
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
      } catch (err: any) {
        const errors = this.errors as any[];

        errors.push(err);
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
      } catch (err: any) {
        const errors = this.errors as any[];

        errors.push(err);
      }
    },

    async fetchSshKeys() {
      const { region, amazonCredentialSecret } = this.config;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      this.loadingSshKeyPairs = true;
      const store = this.$store as Store<any>;

      try {
        const ec2Client = await store.dispatch('aws/ec2', { region: this.config.region, cloudCredentialId: this.config.amazonCredentialSecret });

        const keyPairRes: {KeyPairs: {KeyName: string}[]} = await ec2Client.describeKeyPairs({ DryRun: false });

        this.sshKeyPairs = (keyPairRes.KeyPairs || []).map((key) => {
          return key.KeyName;
        }).sort();
      } catch (err: any) {
        const errors = this.errors as any[];

        errors.push(err);
      }
      this.loadingSshKeyPairs = false;
    },
  }

});
</script>

<template>
  <Loading v-if="fetchState.pending" />

  <CruResource
    v-else
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
    <div
      v-if="hasCredential"
      class="row mb-10"
    >
      <div class="col span-6">
        <LabeledInput
          required
          label-key="eks.clusterName.label"
          :value="normanCluster.name"
          :mode="mode"
          :rules="fvGetAndReportPathRules('name')"
          data-testid="eks-name-input"
          @update:value="setClusterName"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="normanCluster.description"
          :mode="mode"
          label-key="nameNsDescription.description.label"
          :placeholder="t('nameNsDescription.description.placeholder')"
        />
      </div>
    </div>

    <AccountAccess
      :credential="config.amazonCredentialSecret"
      :mode="mode"
      :region="config.region"
      @cancel-credential="cancelCredential"
      @update-region="updateRegion"
      @update-credential="updateCredential"
      @error="e=>errors.push(e)"
    />

    <div
      v-if="hasCredential"
      data-testid="crueks-form"
    >
      <Accordion
        v-if="isImport"
        class="mb-20"
        :title="t('eks.accordionHeaders.cluster')"
        :open-initially="true"
      >
        <Import
          v-model:cluster-name="config.displayName"
          v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
          :credential="config.amazonCredentialSecret"
          :mode="mode"
          :region="config.region"
          :rules="{ displayName: fvGetAndReportPathRules('displayName') }"
          @error="e=>errors.push(e)"
        />
      </Accordion>
      <template v-else>
        <div><h3>{{ t('eks.nodeGroups.title') }}</h3></div>
        <Tabbed
          class="mb-20"
          :side-tabs="true"
          :show-tabs-add-remove="mode !== VIEW"
          @removeTab="removeGroup($event)"
          @addTab="addGroup()"
        >
          <Tab
            v-for="(node, i) in nodeGroups"
            :key="i"
            :label="node.nodegroupName || t('eks.nodeGroups.unnamed')"
            :name="`${node.nodegroupName} ${i}`"
          >
            <NodeGroup
              v-model:node-role="node.nodeRole"
              v-model:launch-template="node.launchTemplate"
              v-model:nodegroup-name="node.nodegroupName"
              v-model:ec2-ssh-key="node.ec2SshKey"
              v-model:tags="node.tags"
              v-model:resource-tags="node.resourceTags"
              v-model:disk-size="node.diskSize"
              v-model:image-id="node.imageId"
              v-model:instance-type="node.instanceType"
              v-model:spot-instance-types="node.spotInstanceTypes"
              v-model:user-data="node.userData"
              v-model:gpu="node.gpu"
              v-model:desired-size="node.desiredSize"
              v-model:min-size="node.minSize"
              v-model:max-size="node.maxSize"
              v-model:request-spot-instances="node.requestSpotInstances"
              v-model:labels="node.labels"
              v-model:version="node.version"
              v-model:pool-is-upgrading="node._isUpgrading"
              :rules="{
                nodegroupName: fvGetAndReportPathRules('nodegroupNames'),
                maxSize: fvGetAndReportPathRules('maxSize'),
                minSize: fvGetAndReportPathRules('minSize'),
                desiredSize: fvGetAndReportPathRules('desiredSize'),
                instanceType: fvGetAndReportPathRules('instanceType'),
                diskSize: fvGetAndReportPathRules('diskSize'),
                minMaxDesired: fvGetAndReportPathRules('minMaxDesired')
              }"
              :cluster-version="config.kubernetesVersion"
              :original-cluster-version="originalVersion"
              :region="config.region"
              :amazon-credential-secret="config.amazonCredentialSecret"
              :is-new-or-unprovisioned="isNewOrUnprovisioned"
              :pool-is-new="node._isNew"
              :mode="mode"
              :instance-type-options="instanceTypeOptions"
              :spot-instance-type-options="spotInstanceTypeOptions"
              :launch-templates="launchTemplates"
              :ec2-roles="ec2Roles"
              :ssh-key-pairs="sshKeyPairs"
              :loading-instance-types="loadingInstanceTypes"
              :loading-roles="loadingIam"
              :loading-launch-templates="loadingLaunchTemplates"
              :loading-ssh-key-pairs="loadingSshKeyPairs"
              :norman-cluster="normanCluster"
            />
          </Tab>
        </Tabbed>
        <Accordion
          class="mb-20"
          :title="t('eks.accordionHeaders.cluster')"
          :open-initially="true"
        >
          <Config
            v-model:kubernetes-version="config.kubernetesVersion"
            v-model:enable-network-policy="normanCluster.enableNetworkPolicy"
            v-model:ebs-c-s-i-driver="config.ebsCSIDriver"
            v-model:service-role="config.serviceRole"
            v-model:kms-key="config.kmsKey"
            v-model:secrets-encryption="config.secretsEncryption"
            v-model:tags="config.tags"
            :mode="mode"
            :config="config"
            :eks-roles="eksRoles"
            :loading-iam="loadingIam"
            :original-version="originalVersion"
            data-testid="eks-config-section"
            @error="errors.push($event)"
          />
        </Accordion>

        <Accordion
          class="mb-20"
          :title="t('eks.accordionHeaders.networking')"
          :open-initially="true"
        >
          <Networking
            v-model:public-access="config.publicAccess"
            v-model:private-access="config.privateAccess"
            v-model:public-access-sources="config.publicAccessSources"
            v-model:subnets="config.subnets"
            v-model:security-groups="config.securityGroups"
            :mode="mode"
            :region="config.region"
            :amazon-credential-secret="config.amazonCredentialSecret"
            :status-subnets="statusSubnets"
            :rules="{subnets:fvGetAndReportPathRules('subnets')}"
          />
        </Accordion>
        <Accordion
          class="mb-20"
          :title="t('eks.accordionHeaders.logging')"
          :open-initially="true"
        >
          <Logging
            v-model:logging-types="config.loggingTypes"
            :mode="mode"
            :config="config"
          />
        </Accordion>
      </template>

      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.clusterAgent')"
      >
        <AgentConfiguration
          v-model:value="normanCluster.clusterAgentDeploymentCustomization"
          :mode="mode"
          type="cluster"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.fleetAgent')"
      >
        <AgentConfiguration
          v-model:value="normanCluster.fleetAgentDeploymentCustomization"
          :mode="mode"
          type="fleet"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('members.memberRoles')"
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
          :parent-id="normanCluster.id ? normanCluster.id : undefined"
          @membership-update="onMembershipUpdate"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('generic.labelsAndAnnotations')"
      >
        <Labels
          v-model:value="normanCluster"
          :mode="mode"
        />
      </Accordion>
    </div>
    <template
      v-if="!hasCredential"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
