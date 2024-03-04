<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSConfig, EKSLaunchTemplate, EKSNodeGroup } from '../types';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Banner from '@components/Banner/Banner.vue';

import { MANAGED_TEMPLATE_PREFIX, parseTags } from '../util/aws';
import { isEmpty } from '@shell/utils/object';
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

const launchTemplateFieldMapping = {
  imageId:      'ImageId',
  userData:     'UserData',
  instanceType: 'InstanceType',
  // nodeRole:     'IAMInstanceProfile.Arn',
  ec2SshKey:    '',
  // TODO nb will need to look for tgs with ResourceType: 'instance'
  resourceTags: 'TagSpecifications',
  diskSize:     'BlockDeviceMappings'
} as {[key: string]: string};

export default defineComponent({
  name: 'EKSNodePool',

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Banner,
    Checkbox,
  },

  props: {
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
      type:    Number,
      default: null
    },
    minSize: {
      type:    Number,
      default: null
    },
    maxSize: {
      type:    Number,
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
    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    instanceTypeOptions: {
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
    }
  },

  created() {
    this.debouncedSetValuesFromTemplate = debounce(this.setValuesFromTemplate, 500);
  },

  data() {
    // TODO nb translate
    return {
      defaultTemplateOption:          { LaunchTemplateName: `Default (one will be created automatically)` },
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
      // TODO nb re-fetch lt version info
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
    hasRancherLaunchTemplate() {
      const eksStatus = this.originalCluster?.eksStatus || {};
      const nodegroupName = this.nodegroupName;
      const nodeGroupTemplateVersion = (eksStatus?.managedLaunchTemplateVersions || {})[nodegroupName];

      return isEmpty(this.launchTemplate) && !isEmpty(eksStatus.managedLaunchTemplateID) && !isEmpty(nodeGroupTemplateVersion);
    },

    hasUserLaunchTemplate() {
      const { launchTemplate = {} } = this;

      return !!launchTemplate.id && !!launchTemplate.version;
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
        // TODO nb set other fields
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
      const { LatestVersionNumber = '1' } = this.selectedLaunchTemplate;

      return [...Array(LatestVersionNumber).keys()].map((version) => version + 1);
    },

    selectedVersionInfo() {
      return (this.selectedLaunchTemplateInfo?.LaunchTemplateVersions || []).find((v: any) => v.VersionNumber === this.launchTemplate.version) || null;
    },

    selectedVersionData() {
      return this.selectedVersionInfo?.LaunchTemplateData;
    },

  },

  methods: {
    // TODO nb loading spinner on any potentially impacted inputs
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
          // TODO nb set back to default?
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

      // per https://github.com/rancher/rancher/issues/30613 some node group details are possible to edit when using a rancher-managed template
      if (this.hasRancherLaunchTemplate) {
        // TODO nb disable fields per https://github.com/rancher/rancher/issues/30613
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
          label="Node Group Name"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:nodegroupName', $event)"
        />
      </div>

      <!-- //TODO nb node instance roles -->
      <div class="col span-6">
        <LabeledSelect
          :mode="mode"
          label="Node Instance Role"
          :options="[]"
          :disabled="!isNewOrUnprovisioned"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          :value="desiredSize"
          label="Desired ASG size"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:desiredSize', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="minSize"
          label="Minimum ASG Size"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:minSize', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          :value="maxSize"
          label="Maximum ASG size"
          :mode="mode"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:maxSize', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          title="Group Labels"
          :read-allowed="false"
          :value="labels"
          :as-map="true"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:labels', $event)"
        >
          <template #title>
            <label class="text-label">Group Labels</label>
          </template>
        </KeyValue>
      </div>
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          title="Group Tags"
          :read-allowed="false"
          :as-map="true"
          :value="tags"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:tags', $event)"
        >
          <template #title>
            <label class="text-label">Group Tags</label>
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
          label="Launch Template"
          :options="launchTemplateOptions"
          option-label="LaunchTemplateName"
          option-key="LaunchTemplateId"
          :disabled="!isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-3">
        <!-- //TODO nb format nicer (include description and which is default) -->
        <LabeledSelect
          v-if="launchTemplate"
          :value="launchTemplate.version"
          :mode="mode"
          label="Template Version"
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
          label="Instance Type"
          :options="instanceTypeOptions"
          :loading="loadingSelectedVersion"
          :value="instanceType"
          :disabled="!!templateValue('instanceType') || requestSpotInstances"
          :tooltip="(requestSpotInstances && !templateValue('instanceType')) ? 'Instance Type will not be sent when requesting spot instances. You must include Spot Instance Types instead.': ''"
          @input="$emit('update:instanceType', $event)"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          label="Amazon Machine Image ID"
          :mode="mode"
          :value="imageId"
          :disabled="hasUserLaunchTemplate"
          @input="$emit('update:imageId', $event)"
        />
      </div>
      <div class="col span-3">
        <!-- //TODO NB unitinput? units or number? -->
        <LabeledInput
          :required="!templateValue('diskSize')"
          label="Node Volume Size"
          :mode="mode"
          :value="diskSize"
          :loading="loadingSelectedVersion"
          :disabled="!!templateValue('diskSize') || loadingSelectedVersion"
          @input="$emit('update:diskSize', $event)"
        />
      </div>
    </div>
    <Banner
      v-if="requestSpotInstances && hasUserLaunchTemplate"
      color="warning"
      label="Amazon recommends selecting multiple instance types when using spot instances. Since the template you have selected allows for only one instance time, your nodes may be interrupted more often."
    />
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="GPU Enabled Instance"
          :value="gpu"
          :disabled="!!templateValue('imageId') || hasRancherLaunchTemplate"
          :tooltip="templateValue('imageId') ? 'This setting is ignored when using a launch template with a custom AMI defined.' : ''"
          @input="$emit('update:gpu', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="requestSpotInstances"
          :mode="mode"
          label="Request Spot Instances"
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
        <!-- //TODO nb are all instance types valid here? -->
        <LabeledSelect
          :mode="mode"
          :value="spotInstanceTypes"
          label="Spot Instance Types"
          :options="instanceTypeOptions"
          :multiple="true"
          @input="$emit('update:spotInstanceTypes', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          label="User Data"
          :mode="mode"
          type="multiline"
          :value="userData"
          :disabled="hasUserLaunchTemplate"
          @input="$emit('update:userData', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          type="multiline"
          :value="ec2SshKey"
          label="SSH Key"
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
          label="Instance Resource Tags"
          :value="resourceTags"
          :disabled="hasUserLaunchTemplate"
          :read-allowed="false"
          :as-map="true"
        >
          <template #title>
            <label class="text-label">Instance Resource Tags</label>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
