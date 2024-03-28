<script lang='ts'>
import { mapGetters, Store } from 'vuex';
import { defineComponent } from 'vue';

import { removeObject } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { diffUpstreamSpec } from '@shell/utils/kontainer';
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

import { EKSConfig, EKSNodeGroup, AWS, NormanCluster } from '../types';
import NodeGroup from './NodeGroup.vue';
import Logging from './Logging.vue';
import Config from './Config.vue';
import Networking from './Networking.vue';
import AccountAccess from './AccountAccess.vue';

const defaultCluster = {
  dockerRootDir:                       '/var/lib/docker',
  enableClusterAlerting:               false,
  enableClusterMonitoring:             false,
  enableNetworkPolicy:                 false,
  labels:                              {},
  windowsPreferedCluster:              false,
  fleetAgentDeploymentCustomization:   {},
  clusterAgentDeploymentCustomization: {}
};

export const DEFAULT_REGION = 'us-west-2';

const DEFAULT_NODE_GROUP_CONFIG = {
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
};

const DEFAULT_EKS_CONFIG = {
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
    AgentConfiguration
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
      // track original version on edit to ensure we don't offer k8s downgrades
      this.originalVersion = this.normanCluster?.eksConfig?.kubernetesVersion || '';
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
    }

    if (!this.normanCluster.eksConfig) {
      this.$set(this.normanCluster, 'eksConfig', { ...DEFAULT_EKS_CONFIG });
    }
    if (!this.normanCluster.fleetAgentDeploymentCustomization) {
      this.$set(this.normanCluster, 'fleetAgentDeploymentCustomization', {});
    }
    if (!this.normanCluster.clusterAgentDeploymentCustomization) {
      this.$set(this.normanCluster, 'clusterAgentDeploymentCustomization', {});
    }
    this.config = this.normanCluster.eksConfig as EKSConfig;

    if (!this.config.nodeGroups || !this.config.nodeGroups.length) {
      this.$set(this.config, 'nodeGroups', [{ ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: 'group1' }]);
    }
    if (this.config.nodeGroups) {
      this.nodeGroups = this.config.nodeGroups;
    } else {
      this.$set(this.config, 'nodeGroups', this.nodeGroups);
    }
    this.fetchInstanceTypes();
    this.fetchLaunchTemplates();
    this.fetchServiceRoles();
  },

  data() {
    return {
      cloudCredentialId: '',
      normanCluster:     { name: '' } as unknown as NormanCluster,
      nodeGroups:        [] as EKSNodeGroup[],
      config:            { } as EKSConfig,
      membershipUpdate:  {} as {newBindings: any[], removedBindings: any[], save: Function},
      originalVersion:   '',

      fvFormRuleSets: [{
        path:  'name',
        rules: ['nameRequired'],
      },
      {
        path:  'nodegroupNames',
        rules: ['nodeGroupNamesUnique', 'nodeGroupNamesRequired']
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
      ],

      loadingInstanceTypes:   false,
      loadingLaunchTemplates: false,

      loadingIam:      false,
      iamInfo:         {} as {Roles: AWS.IamRole[]},
      ec2Roles:        [] as AWS.IamRole[],
      eksRoles:        []as AWS.IamRole[],
      instanceTypes:   [],
      launchTemplates: []
    };
  },

  created() {
    const registerAfterHook = this.registerAfterHook as Function;

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

            if (service && service.includes('AWS.amazonaws.com') && !ec2Roles.find((r) => r.RoleId === role.RoleId) && !role.RoleName.match(/^rancher-managed/)) {
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
      this.nodeGroups.forEach((group: EKSNodeGroup) => this.$set(group, 'version', neu));
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    fvExtraRules() {
      return {
        nameRequired: () => {
          return !this.config.displayName ? this.t('validation.required', { key: this.t('nameNsDescription.name.label') }) : null;
        },
        nodeGroupNamesRequired: (node: EKSNodeGroup) => {
          if (node) {
            return !!node.nodegroupName ? this.t('validation.required', { key: this.t('eks.nodeGroups.name.label') }) : null;
          }

          return !!this.nodeGroups.find((group) => !group.nodegroupName) ? this.t('validation.required', { key: this.t('eks.nodeGroups.name.label') }) : null;
        },
        nodeGroupNamesUnique: (node: EKSNodeGroup): null | string => {
          if (node) {
            return node.__nameUnique === false ? this.t('eks.errors.nodeGroups.nameUnique') : null;
          }
          let out = null as null|string;

          const names = this.nodeGroups.map((node) => node.nodegroupName);

          this.nodeGroups.forEach((group) => {
            const name = group.nodegroupName;

            if (names.filter((n) => n === name).length > 1) {
              this.$set(group, '__nameUnique', false);
              if (!out) {
                out = this.t('eks.errors.nodeGroups.nameUnique');
              }
            }
          });

          return out;
        },
        maxSize: (size: number) => {
          const msg = this.t('eks.errors.greaterThanZero', { key: this.t('eks.nodeGroups.maxSize.label') });

          if (size !== undefined) {
            return size > 0 ? null : msg;
          }

          return !!this.nodeGroups.find((group) => !group.maxSize || group.maxSize <= 0) ? msg : null;
        },
        minSize: (size: number) => {
          const msg = this.t('eks.errors.greaterThanZero', { key: this.t('eks.nodeGroups.minSize.label') });

          if (size !== undefined) {
            return size > 0 ? null : msg;
          }

          return !!this.nodeGroups.find((group) => !group.minSize || group.minSize <= 0) ? msg : null;
        },
        diskSize: (type: string) => {
          if (type || type === '') {
            return !type ? this.t('validation.required', { key: this.t('eks.nodeGroups.diskSize.label') }) : null;
          }

          return !!this.nodeGroups.find((group: EKSNodeGroup) => !group.diskSize ) ? this.t('validation.required', { key: this.t('eks.nodeGroups.instanceType.label') }) : null;
        },
        instanceType: (type: string) => {
          if (type || type === '') {
            return !type ? this.t('validation.required', { key: this.t('eks.nodeGroups.instanceType.label') }) : null;
          }

          return !!this.nodeGroups.find((group: EKSNodeGroup) => !group.instanceType && !group.requestSpotInstances) ? this.t('validation.required', { key: this.t('eks.nodeGroups.instanceType.label') }) : null;
        },
        desiredSize: (size: number) => {
          const msg = this.t('eks.errors.greaterThanZero', { key: this.t('eks.nodeGroups.desiredSize.label') });

          if (size !== undefined) {
            return size > 0 ? null : msg;
          }

          return !!this.nodeGroups.find((group) => !group.desiredSize || group.desiredSize <= 0) ? msg : null;
        },
        subnets: (val: string[]) => {
          const subnets = val || this.config.subnets;

          return subnets && subnets.length === 1 ? this.t('eks.errors.minimumSubnets') : undefined;
        },
        publicPrivateAccess: (): string | undefined => {
          const { publicAccess, privateAccess } = this.config;

          return publicAccess || privateAccess ? undefined : this.t('eks.errors.publicOrPrivate');
        },

      };
    },

    // upstreamSpec will be null if the user created a cluster with some invalid options such that it ultimately fails to create anything in aks
    // this allows them to go back and correct their mistakes without re-making the whole cluster
    isNewOrUnprovisioned(): boolean {
      return this.mode === _CREATE || !this.normanCluster?.status?.eksStatus?.upstreamSpec;
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
      const out = {} as {[key:string]: AWS.InstanceType[]};

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
      const out = [] as AWS.InstanceTypeOption[];

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
      const out = [] as AWS.InstanceTypeOption[];

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
    }
  },

  methods: {
    setClusterName(name: string): void {
      this.$set(this.normanCluster, 'name', name);
      this.$set(this.config, 'displayName', name);
    },

    onMembershipUpdate(update: {newBindings: any[], removedBindings: any[], save: Function}): void {
      this.$set(this, 'membershipUpdate', update);
    },

    async saveRoleBindings(): Promise<void> {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    // only save values that differ from upstream aks spec - see diffUpstreamSpec comments for details
    removeUnchangedConfigFields(): void {
      const upstreamConfig = this.normanCluster?.status?.eksStatus?.upstreamSpec;

      if (upstreamConfig) {
        const diff = diffUpstreamSpec(upstreamConfig, this.config);

        this.$set(this.normanCluster, 'eksConfig', diff);
      }
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
      this.$set(this.config, 'region', e);
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
    },

    updateCredential(e: string) {
      this.$set(this.config, 'amazonCredentialSecret', e);
      this.fetchInstanceTypes();
      this.fetchLaunchTemplates();
      this.fetchServiceRoles();
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
          label-key="eks.clusterName.label"
          :value="normanCluster.name"
          :mode="mode"
          :rules="fvGetAndReportPathRules('name')"
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
      <Tabbed
        class="mb-20"
        :side-tabs="true"
        :show-tabs-add-remove="mode !== 'view'"
        @removeTab="removeGroup($event)"
        @addTab="addGroup()"
      >
        <Tab
          v-for="(node, i) in nodeGroups"
          :key="i"
          :name="node.nodegroupName"
        >
          <NodeGroup
            :rules="{
              nodegroupName: fvGetAndReportPathRules('nodegroupNames'),
              maxSize: fvGetAndReportPathRules('maxSize'),
              minSize: fvGetAndReportPathRules('minSize'),
              desiredSize: fvGetAndReportPathRules('desiredSize'),
              instanceType: fvGetAndReportPathRules('instanceType'),
              diskSize: fvGetAndReportPathRules('diskSize')
            }"
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
            :region="config.region"
            :amazon-credential-secret="config.amazonCredentialSecret"
            :is-new-or-unprovisioned="isNewOrUnprovisioned"
            :mode="mode"
            :instance-type-options="instanceTypeOptions"
            :spot-instance-type-options="spotInstanceTypeOptions"
            :launch-templates="launchTemplates"
            :ec2-roles="ec2Roles"
            :loading-instance-types="loadingInstanceTypes"
            :loading-roles="loadingIam"
            :loading-launch-templates="loadingLaunchTemplates"
          />
        </Tab>
      </Tabbed>
      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.cluster')"
        :open-initially="true"
      >
        <Config
          :kubernetes-version.sync="config.kubernetesVersion"
          :enable-network-policy.sync="config.enableNetworkPolicy"
          :ebs-c-s-i-driver.sync="config.ebsCSIDriver"
          :service-role.sync="config.serviceRole"
          :kms-key.sync="config.kmsKey"
          :tags.sync="config.tags"
          :mode="mode"
          :config="config"
          :eks-roles="eksRoles"
          :loading-iam="loadingIam"
          @error="e=>errors.push(e)"
        />
      </Accordion>

      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.networking')"
        :open-initially="true"
      >
        <Networking
          :public-access.sync="config.publicAccess"
          :private-access.sync="config.privateAccess"
          :public-access-sources.sync="config.publicAccessSources"
          :subnets.sync="config.subnets"
          :mode="mode"
          :region="config.region"
          :amazon-credential-secret="config.amazonCredentialSecret"
          :rules="{subnets:fvGetAndReportPathRules('subnets')}"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.logging')"
        :open-initially="true"
      >
        <Logging
          :mode="mode"
          :config="config"
          :logging-types.sync="config.loggingTypes"
        />
      </Accordion>

      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.clusterAgent')"
      >
        <AgentConfiguration
          v-model="normanCluster.clusterAgentDeploymentCustomization"
          :mode="mode"
          type="cluster"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('eks.accordionHeaders.fleetAgent')"
      >
        <AgentConfiguration
          v-model="normanCluster.fleetAgentDeploymentCustomization"
          :mode="mode"
          type="fleet"
        />
      </Accordion>
      <Accordion
        class="mb-20"
        :title="t('members.clusterMembership')"
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
        :title="t('generic.labelsAndAnnotations')"
      >
        <Labels
          v-model="normanCluster"
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
