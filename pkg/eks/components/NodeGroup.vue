<script lang="ts">
import { defineComponent } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Banner from '@components/Banner/Banner.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { mapGetters, Store } from 'vuex';

import { MANAGED_TEMPLATE_PREFIX, parseTags } from '../util/aws';

import { isEmpty } from '@shell/utils/object';
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

// map between fields in rancher eksConfig and amazon launch templates
const launchTemplateFieldMapping = {
  imageId:      'ImageId',
  userData:     'UserData',
  instanceType: 'InstanceType',
  ec2SshKey:    '',
  resourceTags: 'TagSpecifications',
  diskSize:     'BlockDeviceMappings'
} as {[key: string]: string};

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

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Banner,
    Checkbox,
    UnitInput
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
      type:    String,
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
    mode: {
      type:    String,
      default: _EDIT
    },
    ec2Roles: {
      type:    Array,
      default: () => []
    },
    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
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
      type:    Array,
      default: () => []
    },

    originalCluster: {
      type:    Object as any,
      default: null
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
      defaultTemplateOption:          { LaunchTemplateName: t('eks.defaultCreateOne') },
      defaultNodeRoleOption:          { RoleName: t('eks.defaultCreateOne') },
      loadingSelectedVersion:         false,
      // once a specific lt has been selected, an additional query is made to get full information on every version of it
      selectedLaunchTemplateInfo:     {} as any,
      debouncedSetValuesFromTemplate: null as any,
      // the keyvalue component needs to be re-rendered if the value prop is updated by parent component when as-map=true
      // TODO nb file an issue
      resourceTagKey:                 randomStr()
    };
  },

  watch: {
    'selectedLaunchTemplate'(neu) {
      if (neu && !isEmpty(neu) && this.amazonCredentialSecret) {
        this.fetchLaunchTemplateVersionInfo(this.selectedLaunchTemplate);
      }
    },

    'amazonCredentialSecret'() {
      this.fetchLaunchTemplateVersionInfo(this.selectedLaunchTemplate);
    },

    'selectedVersionData'(neu = {}, old = {}) {
      this.loadingSelectedVersion = true;
      this.debouncedSetValuesFromTemplate(neu, old);
    },

    'requestSpotInstances'(neu) {
      if (neu && !this.templateValue('instanceType')) {
        this.$emit('update:instanceType', null);
      } else {
        this.$emit('update:spotInstanceTypes', null);
      }
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    hasRancherLaunchTemplate() {
      const eksStatus = this.originalCluster?.eksStatus || {};
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

    launchTemplateOptions() {
      return [this.defaultTemplateOption, ...this.launchTemplates.filter((template: any) => !(template?.LaunchTemplateName || '').startsWith(MANAGED_TEMPLATE_PREFIX))];
    },

    selectedLaunchTemplate: {
      get(): any {
        const id = this.launchTemplate?.id;

        return this.launchTemplateOptions.find((lt: any) => lt.LaunchTemplateId === id);
      },
      set(neu: any) {
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

    launchTemplateVersionOptions() {
      if (this.selectedLaunchTemplate) {
        const { LatestVersionNumber = '1' } = this.selectedLaunchTemplate;

        return [...Array(LatestVersionNumber).keys()].map((version) => version + 1);
      }

      return [];
    },

    selectedVersionInfo() {
      return (this.selectedLaunchTemplateInfo?.LaunchTemplateVersions || []).find((v: any) => v.VersionNumber === this.launchTemplate.version) || null;
    },

    selectedVersionData() {
      return this.selectedVersionInfo?.LaunchTemplateData;
    },

    displayNodeRole: {
      get() {
        const arn = this.nodeRole;

        if (!arn) {
          return this.defaultNodeRoleOption;
        }

        return this.ec2Roles.find((role: any) => role.Arn === arn) ;
      },
      set(neu: any) {
        if (neu.Arn) {
          this.$emit('update:nodeRole', neu.Arn);
        } else {
          this.$emit('update:nodeRole', '');
        }
      }
    },

    userDataPlaceholder() {
      return DEFAULT_USER_DATA;
    }
  },

  methods: {
    async fetchLaunchTemplateVersionInfo(launchTemplate: any) {
      const { region, amazonCredentialSecret } = this;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      const store = this.$store as Store<any>;
      const ec2Client = await store.dispatch('aws/ec2', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        this.selectedLaunchTemplateInfo = await ec2Client.describeLaunchTemplateVersions({ LaunchTemplateId: launchTemplate.LaunchTemplateId, Versions: [this.launchTemplate.version] });
      } catch (err) {
        this.$emit('error', err);
      }
    },

    setValuesFromTemplate(neu = {} as any, old = {} as any) {
      Object.keys(launchTemplateFieldMapping).forEach((rancherKey: string) => {
        const awsKey = launchTemplateFieldMapping[rancherKey];

        if (awsKey === 'TagSpecifications') {
          const { TagSpecifications } = neu;

          if (TagSpecifications) {
            const tags = {} as any;

            TagSpecifications.forEach((tag: any) => {
              if (tag.ResourceType === 'instance' && tag.Tags && tag.Tags.length) {
                Object.assign(tags, parseTags(tag.Tags));
              }
            });
            this.$emit('update:resourceTags', tags);
          } else {
            this.$emit('update:resourceTags', {});
          }
        } else if (awsKey === 'BlockDeviceMappings') {
          const { BlockDeviceMappings } = neu;

          if (BlockDeviceMappings && BlockDeviceMappings.length) {
            const size = BlockDeviceMappings[0]?.Ebs?.VolumeSize;

            this.$emit('update:diskSize', size);
          } else {
            this.$emit('update:diskSize', null);
          }
        } else if (this.templateValue(rancherKey)) {
          this.$emit(`update:${ rancherKey }`, this.templateValue(rancherKey));
        } else {
          this.$emit(`update:${ rancherKey }`, null);
        }
      });
      this.$nextTick(() => {
        this.resourceTagKey = randomStr();
        this.loadingSelectedVersion = false;
      });
    },

    templateValue(field: string): any {
      if (this.hasNoLaunchTemplate) {
        return null;
      }

      const launchTemplateKey = launchTemplateFieldMapping[field];

      if (!launchTemplateKey) {
        return null;
      }
      const launchTemplateVal = this.selectedVersionData?.[launchTemplateKey];

      if (launchTemplateVal !== undefined && (!(typeof launchTemplateVal === 'object') || !isEmpty(launchTemplateVal))) {
        if (field === 'diskSize') {
          return launchTemplateVal[0]?.Ebs?.VolumeSize || null;
        }
        if (field === 'resourceTags') {
          return (launchTemplateVal || []).filter((tag: any) => tag.ResourceType === 'instance');
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
    <h3>Group Details</h3>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="nodegroupName"
          label-key="eks.nodeGroups.name.label"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.nodegroupName"
          @input="$emit('update:nodegroupName', $event)"
        />
      </div>

      <div class="col span-6">
        <LabeledSelect
          v-model="displayNodeRole"
          :mode="mode"
          label-key="eks.nodeGroups.nodeRole.label"
          :options="[defaultNodeRoleOption, ...ec2Roles]"
          option-label="RoleName"
          option-key="Arn"
          :disabled="!isNewOrUnprovisioned"
          :loading="loadingRoles"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          type="number"
          :value="desiredSize"
          label-key="eks.nodeGroups.desiredSize.label"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.desiredSize"
          @input="$emit('update:desiredSize', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          type="number"
          :value="minSize"
          label-key="eks.nodeGroups.minSize.label"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.minSize"
          @input="$emit('update:minSize', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          type="number"
          :value="maxSize"
          label-key="eks.nodeGroups.maxSize.label"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          :rules="rules.maxSize"
          @input="$emit('update:maxSize', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          :title="t('eks.nodeGroups.groupLabels.label')"
          :read-allowed="false"
          :value="labels"
          :as-map="true"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:labels', $event)"
        >
          <template #title>
            <label class="text-label">{{ t('eks.nodeGroups.groupLabels.label') }}</label>
          </template>
        </KeyValue>
      </div>
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          :title="t('eks.nodeGroups.groupTags.label')"
          :read-allowed="false"
          :as-map="true"
          :value="tags"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:tags', $event)"
        >
          <template #title>
            <label class="text-label">{{ t('eks.nodeGroups.groupTags.label') }}</label>
          </template>
        </KeyValue>
      </div>
    </div>
    <hr class="mb-20">
    <h3>Node Template Details</h3>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          v-model="selectedLaunchTemplate"
          :mode="mode"
          label-key="eks.nodeGroups.launchTemplate.label"
          :options="launchTemplateOptions"
          option-label="LaunchTemplateName"
          option-key="LaunchTemplateId"
          :disabled="!isNewOrUnprovisioned"
          :loading="loadingLaunchTemplates"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-if="launchTemplate"
          :value="launchTemplate.version"
          :mode="mode"
          label-key="eks.nodeGroups.launchTemplate.version"
          :options="launchTemplateVersionOptions"
          @input="$emit('update:launchTemplate', {...launchTemplate, version: $event})"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          :required="!requestSpotInstances"
          :mode="mode"
          label-key="eks.nodeGroups.instanceType.label"
          :options="instanceTypeOptions"
          :loading="loadingSelectedVersion||loadingInstanceTypes"
          :value="instanceType"
          :disabled="!!templateValue('instanceType') || requestSpotInstances"
          :tooltip="(requestSpotInstances && !templateValue('instanceType')) ? t('eks.nodeGroups.instanceType.tooltip'): ''"
          :rules="!requestSpotInstances ? rules.instanceType : []"

          @input="$emit('update:instanceType', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          label-key="eks.nodeGroups.imageId.label"
          :mode="mode"
          :value="imageId"
          :disabled="hasUserLaunchTemplate"
          @input="$emit('update:imageId', $event)"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          :required="!templateValue('diskSize')"
          label-key="eks.nodeGroups.diskSize.label"
          :mode="mode"
          :value="diskSize"
          suffix="GB"
          :loading="loadingSelectedVersion"
          :disabled="!!templateValue('diskSize') || loadingSelectedVersion"
          :rules="rules.diskSize"
          @input="$emit('update:diskSize', $event)"
        />
      </div>
    </div>
    <Banner
      v-if="requestSpotInstances && hasUserLaunchTemplate"
      color="warning"
      :label="t('eks.nodeGroups.requestSpotInstances.warning')"
    />
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label-key="eks.nodeGroups.gpu.label"
          :value="gpu"
          :disabled="!!templateValue('imageId') || hasRancherLaunchTemplate"
          :tooltip="templateValue('imageId') ? t('eks.nodeGroups.gpu.tooltip') : ''"
          @input="$emit('update:gpu', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="requestSpotInstances"
          :mode="mode"
          label-key="eks.nodeGroups.requestSpotInstances.label"
          :disabled="hasRancherLaunchTemplate"
          @input="$emit('update:requestSpotInstances', $event)"
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
          @input="$emit('update:spotInstanceTypes', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          label-key="eks.nodeGroups.userData.label"
          :mode="mode"
          type="multiline"
          :value="userData"
          :disabled="hasUserLaunchTemplate"
          :placeholder="userDataPlaceholder"
          @input="$emit('update:userData', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          type="multiline"
          :value="ec2SshKey"
          label-key="eks.nodeGroups.ec2SshKey.label"
          :mode="mode"
          :disabled="hasUserLaunchTemplate"
          @input="$emit('update:ec2SshKey', $event)"
        />
      </div>
    </div>
    <div row="mb-10">
      <div class="col span-6">
        <KeyValue
          :key="resourceTagKey"
          :mode="mode"
          label-key="eks.nodeGroups.resourceTags.label"
          :value="resourceTags"
          :disabled="hasUserLaunchTemplate"
          :read-allowed="false"
          :as-map="true"
        >
          <template #title>
            <label class="text-label">{{ t('eks.nodeGroups.resourceTags.label') }}</label>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
