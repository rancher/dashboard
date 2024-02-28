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

// const DEFAULT_REGION = 'eastus';

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
    // LabeledInput,
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
      this.originalVersion = this.normanCluster?.aksConfig?.kubernetesVersion;
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...defaultCluster }, { root: true });
    }

    // TODO nb do this better?
    // TODO nb defaults
    this.config = this.normanCluster.eksConfig || {};

    if (!this.config.nodeGroups || !this.config.nodeGroups.length) {
      this.$set(this.config, 'nodeGroups', [{ ...DEFAULT_NODE_GROUP_CONFIG, nodegroupName: 'group1' }]);
    }
    this.nodeGroups = this.config.nodeGroups;
  },

  data() {
    const store = this.$store as Store<any>;

    const t = store.getters['i18n/t'];

    return {
      cloudCredentialId:  '',
      normanCluster:      { name: '' } as any,
      nodeGroups:         [] as EKSNodeGroup[],
      config:             { } as EKSConfig,
      membershipUpdate:   {} as any,
      originalVersion:    '',
      // fvFormRuleSets:        [],
      // TODO nb default from config
      customServiceRole:  false,
      serviceRoleOptions: [{ value: false, label: 'Standard: A service role will be automatically created' }, { value: true, label: 'Custom: Choose from an existing service role' }]
    };
  },

  created() {
    const registerAfterHook = this.registerAfterHook as Function;

    registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
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

      //   this.$set(this.normanCluster, 'aksConfig', diff);
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
      // TODO nb group aws calls
      this.$set(this.config, 'region', e);
    },

    updateCredential(e: any) {
      // TODO nb use region from credential?
      this.$set(this.config, 'amazonCredentialSecret', e);
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
    }
  },

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
    <Accordion
      class="mb-20"
      title="Account Access"
      :open-initially="true"
    >
      <AccountAccess
        :credential="config.amazonCredentialSecret"
        :mode="mode"
        :region="config.region"
        @cancel-credential="cancelCredential"
        @update-region="updateRegion"
        @update-credential="updateCredential"
        @error="e=>errors.push(e)"
      />
    </Accordion>
    <Accordion
      class="mb-20"
      title="Cluster Options"
      :open-initially="true"
    >
      <Config
        :mode="mode"
        :config="config"
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
          :node="node"
          :mode="mode"
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
        :config="config"
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
