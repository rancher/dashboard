<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapGetters, Store } from 'vuex';
import debounce from 'lodash/debounce';

import { _EDIT, _VIEW } from '@shell/config/query-params';
import { randomStr } from '@shell/utils/string';
import { isEmpty } from '@shell/utils/object';

import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Banner from '@components/Banner/Banner.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';

import { MANAGED_TEMPLATE_PREFIX, parseTags } from '../util/aws';
import { AWS } from '../types';
import { DEFAULT_NODE_GROUP_CONFIG } from './CruEKS.vue';

// map between fields in rancher eksConfig and amazon launch templates
const launchTemplateFieldMapping: {[key: string]: string} = {
  imageId:      'ImageId',
  userData:     'UserData',
  instanceType: 'InstanceType',
  ec2SshKey:    '',
  resourceTags: 'TagSpecifications',
  diskSize:     'BlockDeviceMappings'
};

const DEFAULT_USER_DATA =
`MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
echo "Running custom user data script"

--==MYBOUNDARY==--\\`;

export default defineComponent({
  name: 'EKSNodePool',

  emits: ['update:instanceType', 'update:spotInstanceTypes', 'update:ec2SshKey', 'update:launchTemplate', 'update:nodeRole', 'update:nodeRole', 'update:version', 'update:poolIsUpgrading', 'error', 'update:resourceTags', 'update:diskSize', 'update:nodegroupName', 'update:desiredSize', 'update:minSize', 'update:maxSize', 'update:labels', 'update:tags', 'update:imageId', 'update:gpu', 'update:requestSpotInstances', 'update:userData', 'update:ec2SshKey'],

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Banner,
    Checkbox,
    UnitInput,
    FileSelector
  },

  props: {
    nodeRole: {
      type:    String,
      default: ''
    },
    resourceTags: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    requestSpotInstances: {
      type:    Boolean,
      default: false
    },
    spotInstanceTypes: {
      type:    Array,
      default: () => []
    },
    labels: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    tags: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    gpu: {
      type:    Boolean,
      default: false
    },
    userData: {
      type:    String,
      default: ''
    },
    instanceType: {
      type:    String,
      default: ''
    },
    imageId: {
      type:    [String, null],
      default: ''
    },
    desiredSize: {
      type:    [Number, String],
      default: null
    },
    minSize: {
      type:    [Number, String],
      default: null
    },
    maxSize: {
      type:    [Number, String],
      default: null
    },
    diskSize: {
      type:    Number,
      default: null
    },
    ec2SshKey: {
      type:    String,
      default: ''
    },
    nodegroupName: {
      type:    String,
      default: ''
    },
    region: {
      type:    String,
      default: ''
    },
    amazonCredentialSecret: {
      type:    String,
      default: ''
    },

    launchTemplate: {
      type:    Object,
      default: () => {}
    },

    version: {
      type:    String,
      default: ''
    },

    clusterVersion: {
      type:    String,
      default: ''
    },

    originalClusterVersion: {
      type:    String,
      default: ''
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    ec2Roles: {
      type:    Array as PropType<AWS.IamRole[]>,
      default: () => []
    },

    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    poolIsNew: {
      type:    Boolean,
      default: false
    },

    instanceTypeOptions: {
      type:    Array,
      default: () => []
    },

    spotInstanceTypeOptions: {
      type:    Array,
      default: () => []
    },

    launchTemplates: {
      type:    Array as PropType<AWS.LaunchTemplate[]>,
      default: () => []
    },

    sshKeyPairs: {
      type:    Array as PropType<string[]>,
      default: () => []
    },

    normanCluster: {
      type:    Object,
      default: null
    },

    poolIsUpgrading: {
      type:    Boolean,
      default: false
    },

    loadingInstanceTypes: {
      type:    Boolean,
      default: false
    },

    loadingRoles: {
      type:    Boolean,
      default: false
    },

    loadingLaunchTemplates: {
      type:    Boolean,
      default: false
    },

    loadingSshKeyPairs: {
      type:    Boolean,
      default: false
    },

    rules: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  created() {
    this.debouncedSetValuesFromTemplate = debounce(this.setValuesFromTemplate, 500);
  },

  data() {
    const store = this.$store as Store<any>;
    const t = store.getters['i18n/t'];

    return {
      originalNodeVersion:   this.version,
      defaultTemplateOption: { LaunchTemplateName: t('eks.defaultCreateOne') } as AWS.LaunchTemplate,

      defaultNodeRoleOption:          { RoleName: t('eks.defaultCreateOne') },
      loadingSelectedVersion:         false,
      // once a specific lt has been selected, an additional query is made to get full information on every version of it
      selectedLaunchTemplateInfo:     {} as AWS.LaunchTemplateDetail,
      debouncedSetValuesFromTemplate: null as Function | null,
      // the keyvalue component needs to be re-rendered if the value prop is updated by parent component when as-map=true
      // TODO nb file an issue
      resourceTagKey:                 randomStr()
    };
  },

  watch: {
    selectedLaunchTemplate: {
      handler(neu) {
        if (neu && neu.LaunchTemplateId && this.amazonCredentialSecret) {
          this.fetchLaunchTemplateVersionInfo(this.selectedLaunchTemplate);
        }
      },
      immediate: true
    },

    amazonCredentialSecret: {
      handler() {
        this.fetchLaunchTemplateVersionInfo(this.selectedLaunchTemplate);
      },
      immediate: true
    },

    'selectedVersionData'(neu = {}, old = {}) {
      this.loadingSelectedVersion = true;
      if (this.debouncedSetValuesFromTemplate) {
        this.debouncedSetValuesFromTemplate(neu, old);
      }
    },

    'requestSpotInstances'(neu) {
      if (neu && !this.templateValue('instanceType')) {
        this.$emit('update:instanceType', null);
      } else {
        this.$emit('update:spotInstanceTypes', null);
      }
    },

    sshKeyPairs: {
      handler(neu) {
        if (!neu.includes(this.ec2SshKey)) {
          this.$emit('update:ec2SshKey', '');
        }
      },
      deep: true
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    rancherTemplate() {
      const eksStatus = this.normanCluster?.eksStatus || {};

      return eksStatus.managedLaunchTemplateID;
    },

    hasRancherLaunchTemplate() {
      const eksStatus = this.normanCluster?.eksStatus || {};
      const nodegroupName = this.nodegroupName;
      const nodeGroupTemplateVersion = (eksStatus?.managedLaunchTemplateVersions || {})[nodegroupName];

      return isEmpty(this.launchTemplate) && !isEmpty(eksStatus.managedLaunchTemplateID) && !isEmpty(nodeGroupTemplateVersion);
    },

    hasUserLaunchTemplate() {
      const { launchTemplate = {} } = this;

      return !!launchTemplate?.id && !!launchTemplate?.version;
    },

    hasNoLaunchTemplate() {
      return !this.hasRancherLaunchTemplate && !this.hasUserLaunchTemplate;
    },

    launchTemplateOptions(): AWS.LaunchTemplate[] {
      return [this.defaultTemplateOption, ...this.launchTemplates.filter((template) => !(template?.LaunchTemplateName || '').startsWith(MANAGED_TEMPLATE_PREFIX))];
    },

    selectedLaunchTemplate: {
      get(): AWS.LaunchTemplate {
        if (this.hasRancherLaunchTemplate) {
          return { LaunchTemplateId: this.rancherTemplate, LaunchTemplateName: this.t('eks.nodeGroups.launchTemplate.rancherManaged', { name: this.rancherTemplate }) };
        }
        const id = this.launchTemplate?.id;

        return this.launchTemplateOptions.find((lt: AWS.LaunchTemplate) => lt.LaunchTemplateId && lt.LaunchTemplateId === id) || this.defaultTemplateOption;
      },
      set(neu: AWS.LaunchTemplate) {
        if (neu.LaunchTemplateName === this.defaultTemplateOption.LaunchTemplateName) {
          this.$emit('update:launchTemplate', {});

          return;
        }
        const name = neu.LaunchTemplateName;
        const id = neu.LaunchTemplateId;
        const version = neu.DefaultVersionNumber;

        this.$emit('update:launchTemplate', {
          name, id, version
        });
      }
    },

    launchTemplateVersionOptions(): number[] {
      if (this.selectedLaunchTemplateInfo && this.selectedLaunchTemplateInfo?.LaunchTemplateVersions) {
        return this.selectedLaunchTemplateInfo.LaunchTemplateVersions.map((version) => version.VersionNumber).sort();
      }

      return [];
    },

    selectedVersionInfo(): AWS.LaunchTemplateVersion | null {
      return (this.selectedLaunchTemplateInfo?.LaunchTemplateVersions || []).find((v: any) => v.VersionNumber === this.launchTemplate?.version) || null;
    },

    selectedVersionData(): AWS.LaunchTemplateVersionData | undefined {
      return this.selectedVersionInfo?.LaunchTemplateData;
    },

    displayNodeRole: {
      get() {
        const arn = this.nodeRole;

        if (!arn) {
          return this.defaultNodeRoleOption;
        }

        return this.ec2Roles.find((role: AWS.IamRole) => role.Arn === arn) ;
      },
      set(neu: AWS.IamRole) {
        if (neu.Arn) {
          this.$emit('update:nodeRole', neu.Arn);
        } else {
          this.$emit('update:nodeRole', '');
        }
      }
    },

    userDataPlaceholder() {
      return DEFAULT_USER_DATA;
    },

    poolIsUnprovisioned() {
      return this.isNewOrUnprovisioned || this.poolIsNew;
    },

    clusterWillUpgrade() {
      return this.clusterVersion !== this.originalClusterVersion;
    },

    nodeCanUpgrade() {
      return !this.clusterWillUpgrade && this.originalNodeVersion !== this.clusterVersion && !this.poolIsNew;
    },

    willUpgrade: {
      get() {
        return this.nodeCanUpgrade && this.version === this.clusterVersion;
      },
      set(neu: boolean) {
        if (neu) {
          this.$emit('update:version', this.clusterVersion);
          this.$emit('update:poolIsUpgrading', true);
        } else {
          this.$emit('update:version', this.originalNodeVersion);
          this.$emit('update:poolIsUpgrading', false);
        }
      }
    },

    minMaxDesiredErrors() {
      const errs = (this.rules?.minMaxDesired || []).reduce((errs: string[], rule: Function) => {
        const err = rule({
          minSize: this.minSize, maxSize: this.maxSize, desiredSize: this.desiredSize
        });

        if (err) {
          errs.push(err);
        }

        return errs;
      }, [] as string[]);

      return errs.length ? errs.join(' ') : null;
    },

    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    async fetchLaunchTemplateVersionInfo(launchTemplate: AWS.LaunchTemplate) {
      const { region, amazonCredentialSecret } = this;

      if (!region || !amazonCredentialSecret || this.isView) {
        return;
      }
      const store = this.$store as Store<any>;
      const ec2Client = await store.dispatch('aws/ec2', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        if (launchTemplate.LaunchTemplateName !== this.defaultTemplateOption.LaunchTemplateName) {
          if (launchTemplate.LaunchTemplateId) {
            this.selectedLaunchTemplateInfo = await ec2Client.describeLaunchTemplateVersions({ LaunchTemplateId: launchTemplate.LaunchTemplateId });
          } else {
            this.selectedLaunchTemplateInfo = await ec2Client.describeLaunchTemplateVersions({ LaunchTemplateName: launchTemplate.LaunchTemplateName });
          }
        }
      } catch (err) {
        this.$emit('error', err);
      }
    },

    setValuesFromTemplate(neu = {} as AWS.LaunchTemplateVersionData, old = {} as AWS.LaunchTemplateVersionData) {
      Object.keys(launchTemplateFieldMapping).forEach((rancherKey: string) => {
        const awsKey = launchTemplateFieldMapping[rancherKey];

        if (awsKey === 'TagSpecifications') {
          const { TagSpecifications } = neu;

          if (TagSpecifications) {
            const tags = {} as {[key:string]: string};

            TagSpecifications.forEach((tag: {Tags?: {Key: string, Value: string}[], ResourceType?: string}) => {
              if (tag.ResourceType === 'instance' && tag.Tags && tag.Tags.length) {
                Object.assign(tags, parseTags(tag.Tags));
              }
            });
            this.$emit('update:resourceTags', tags);
          } else {
            this.$emit('update:resourceTags', { ...DEFAULT_NODE_GROUP_CONFIG.resourceTags });
          }
        } else if (awsKey === 'BlockDeviceMappings') {
          const { BlockDeviceMappings } = neu;

          if (BlockDeviceMappings && BlockDeviceMappings.length) {
            const size = BlockDeviceMappings[0]?.Ebs?.VolumeSize;

            this.$emit('update:diskSize', size);
          } else {
            this.$emit('update:diskSize', DEFAULT_NODE_GROUP_CONFIG.diskSize);
          }
        } else if (this.templateValue(rancherKey)) {
          this.$emit(`update:${ rancherKey }`, this.templateValue(rancherKey));
        } else {
          this.$emit(`update:${ rancherKey }`, DEFAULT_NODE_GROUP_CONFIG[rancherKey as keyof typeof DEFAULT_NODE_GROUP_CONFIG]);
        }
      });

      this.$nextTick(() => {
        this.resourceTagKey = randomStr();
        this.loadingSelectedVersion = false;
      });
    },

    templateValue(field: string): string | null | AWS.TagSpecification | AWS.TagSpecification[] | AWS.BlockDeviceMapping[] {
      if (this.hasNoLaunchTemplate) {
        return null;
      }

      const launchTemplateKey = launchTemplateFieldMapping[field] as keyof AWS.LaunchTemplateVersionData;

      if (!launchTemplateKey) {
        return null;
      }
      const launchTemplateVal = this.selectedVersionData?.[launchTemplateKey];

      if (launchTemplateVal !== undefined && (!(typeof launchTemplateVal === 'object') || !isEmpty(launchTemplateVal))) {
        if (field === 'diskSize') {
          const blockMapping = launchTemplateVal[0] as AWS.BlockDeviceMapping;

          return blockMapping?.Ebs?.VolumeSize || null;
        }
        if (field === 'resourceTags') {
          const tags = (launchTemplateVal || []) as AWS.TagSpecification[];

          return tags.filter((tag: AWS.TagSpecification) => tag.ResourceType === 'instance')[0];
        }

        return launchTemplateVal;
      }

      return null;
    },
  },
});
</script>

<template>
  <div>
    <h3>{{ t('eks.nodeGroups.groupDetails') }}</h3>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="nodegroupName"
          label-key="eks.nodeGroups.name.label"
          :mode="mode"
          :disabled="!poolIsUnprovisioned"
          :rules="rules.nodegroupName"
          data-testid="eks-nodegroup-name"
          required
          @update:value="$emit('update:nodegroupName', $event)"
        />
      </div>

      <div class="col span-6">
        <LabeledSelect
          v-model:value="displayNodeRole"
          :mode="mode"
          label-key="eks.nodeGroups.nodeRole.label"
          :options="[defaultNodeRoleOption, ...ec2Roles]"
          option-label="RoleName"
          option-key="Arn"
          :disabled="!poolIsUnprovisioned"
          :loading="loadingRoles"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          type="number"
          :value="desiredSize"
          label-key="eks.nodeGroups.desiredSize.label"
          :mode="mode"
          :rules="rules.desiredSize"
          @update:value="$emit('update:desiredSize', parseInt($event))"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :value="minSize"
          label-key="eks.nodeGroups.minSize.label"
          :mode="mode"
          :rules="rules.minSize"
          @update:value="$emit('update:minSize', parseInt($event))"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          type="number"
          :value="maxSize"
          label-key="eks.nodeGroups.maxSize.label"
          :mode="mode"
          :rules="rules.maxSize"
          @update:value="$emit('update:maxSize', parseInt($event))"
        />
      </div>
    </div>
    <Banner
      v-if="!!minMaxDesiredErrors"
      color="error"
      :label="minMaxDesiredErrors"
    />
    <div class="row mb-10">
      <div class="col span-6 mt-20">
        <KeyValue
          :mode="mode"
          :title="t('eks.nodeGroups.groupLabels.label')"
          :read-allowed="false"
          :value="labels"
          :as-map="true"
          @update:value="$emit('update:labels', $event)"
        >
          <template #title>
            <h4>
              {{ t('eks.nodeGroups.groupLabels.label') }}
            </h4>
          </template>
        </KeyValue>
      </div>
      <div class="col span-6 mt-20">
        <KeyValue
          :mode="mode"
          :title="t('eks.nodeGroups.groupTags.label')"
          :read-allowed="false"
          :as-map="true"
          :value="tags"
          data-testid="eks-resource-tags-input"
          @update:value="$emit('update:tags', $event)"
        >
          <template #title>
            <h4>{{ t('eks.nodeGroups.groupTags.label') }}</h4>
          </template>
        </KeyValue>
      </div>
    </div>
    <hr class="mb-20">
    <h3>{{ t('eks.nodeGroups.templateDetails') }}</h3>
    <Banner
      v-if="clusterWillUpgrade && !poolIsUnprovisioned"
      color="info"
      label-key="eks.nodeGroups.kubernetesVersion.clusterWillUpgrade"
      data-testid="eks-version-upgrade-banner"
    />
    <div class="row mb-10">
      <div class="col span-4 upgrade-version">
        <LabeledInput
          v-if="!nodeCanUpgrade"
          label-key="eks.nodeGroups.kubernetesVersion.label"
          :disabled="true"
          :value="version"
          data-testid="eks-version-display"
        />
        <Checkbox
          v-else
          v-model:value="willUpgrade"
          :label="t('eks.nodeGroups.kubernetesVersion.upgrade', {from: originalNodeVersion, to: clusterVersion})"
          data-testid="eks-version-upgrade-checkbox"
          :disabled="isView"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model:value="selectedLaunchTemplate"
          :mode="mode"
          label-key="eks.nodeGroups.launchTemplate.label"
          :options="launchTemplateOptions"
          option-label="LaunchTemplateName"
          option-key="LaunchTemplateId"
          :disabled="!poolIsUnprovisioned"
          :loading="loadingLaunchTemplates"
          data-testid="eks-launch-template-dropdown"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-if="hasUserLaunchTemplate"
          :value="launchTemplate.version"
          :mode="mode"
          label-key="eks.nodeGroups.launchTemplate.version"
          :options="launchTemplateVersionOptions"
          data-testid="eks-launch-template-version-dropdown"
          @update:value="$emit('update:launchTemplate', {...launchTemplate, version: $event})"
        />
      </div>
    </div>
    <Banner
      color="info"
      label-key="eks.nodeGroups.imageId.tooltip"
    />
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          label-key="eks.nodeGroups.imageId.label"
          :mode="mode"
          :value="imageId"
          :disabled="hasUserLaunchTemplate"
          data-testid="eks-image-id-input"
          @update:value="$emit('update:imageId', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :required="!requestSpotInstances && !templateValue('instanceType')"
          :mode="mode"
          label-key="eks.nodeGroups.instanceType.label"
          :options="instanceTypeOptions"
          :loading="loadingInstanceTypes"
          :value="instanceType"
          :disabled="!!templateValue('instanceType') || requestSpotInstances"
          :tooltip="(requestSpotInstances && !templateValue('instanceType')) ? t('eks.nodeGroups.instanceType.tooltip'): ''"
          :rules="!requestSpotInstances ? rules.instanceType : []"
          data-testid="eks-instance-type-dropdown"
          @update:value="$emit('update:instanceType', $event)"
        />
      </div>

      <div class="col span-4">
        <UnitInput
          :required="!templateValue('diskSize')"
          label-key="eks.nodeGroups.diskSize.label"
          :mode="mode"
          :value="diskSize"
          suffix="GB"
          :loading="loadingSelectedVersion"
          :disabled="!!templateValue('diskSize') || loadingSelectedVersion"
          :rules="rules.diskSize"
          data-testid="eks-disksize-input"
          @update:value="$emit('update:diskSize', $event)"
        />
      </div>
    </div>
    <Banner
      v-if="requestSpotInstances && hasUserLaunchTemplate"
      color="warning"
      :label="t('eks.nodeGroups.requestSpotInstances.warning')"
      data-testid="eks-spot-instance-banner"
    />
    <div class="row mb-10">
      <div class="col span-4">
        <Checkbox
          :mode="mode"
          label-key="eks.nodeGroups.gpu.label"
          :value="gpu"
          :disabled="!!templateValue('imageId') || hasRancherLaunchTemplate"
          :tooltip="templateValue('imageId') ? t('eks.nodeGroups.gpu.tooltip') : ''"
          data-testid="eks-gpu-input"
          @update:value="$emit('update:gpu', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          :value="requestSpotInstances"
          :mode="mode"
          label-key="eks.nodeGroups.requestSpotInstances.label"
          :disabled="hasRancherLaunchTemplate"
          @update:value="$emit('update:requestSpotInstances', $event)"
        />
      </div>
    </div>
    <div
      v-if="requestSpotInstances && !templateValue('instanceType')"
      class="row mb-10"
    >
      <div
        class="col span-6"
      >
        <LabeledSelect
          :mode="mode"
          :value="spotInstanceTypes"
          label-key="eks.nodeGroups.spotInstanceTypes.label"
          :options="spotInstanceTypeOptions"
          :multiple="true"
          :loading="loadingSelectedVersion || loadingInstanceTypes"
          data-testid="eks-spot-instance-type-dropdown"
          @update:value="$emit('update:spotInstanceTypes', $event)"
        />
      </div>
    </div>
    <div class="row mb-15">
      <div class="col span-6 user-data">
        <LabeledInput
          label-key="eks.nodeGroups.userData.label"
          :mode="mode"
          type="multiline"
          :value="userData"
          :disabled="hasUserLaunchTemplate"
          :placeholder="userDataPlaceholder"
          :sub-label="t('eks.nodeGroups.userData.tooltip', {}, true)"
          @update:value="$emit('update:userData', $event)"
        />
        <FileSelector
          :mode="mode"
          :label="t('generic.readFromFile')"
          class="role-tertiary mt-20"
          @selected="$emit('update:userData', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          :loading="loadingSshKeyPairs"
          :value="ec2SshKey"
          :options="sshKeyPairs"
          label-key="eks.nodeGroups.ec2SshKey.label"
          :mode="mode"
          :disabled="hasUserLaunchTemplate"
          :taggable="true"
          :searchable="true"
          data-testid="eks-nodegroup-ec2-key-select"
          @update:value="$emit('update:ec2SshKey', $event)"
        />
      </div>
    </div>
    <div row="mb-10">
      <div class="col span-12 mt-20">
        <KeyValue
          :mode="mode"
          label-key="eks.nodeGroups.resourceTags.label"
          :value="resourceTags"
          :disabled="hasUserLaunchTemplate"
          :read-allowed="false"
          :as-map="true"
          @update:value="$emit('update:resourceTags', $event)"
        >
          <template #title>
            <h4>
              {{ t('eks.nodeGroups.resourceTags.label') }}
            </h4>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-data{
  &>button{
    float: right;
  }
}

.upgrade-version {
  display: flex;
  align-items: center;
}
</style>
