<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSNodeGroup } from '../types';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

export default defineComponent({
  name: 'EKSNodePool',

  components: {
    LabeledInput,
    LabeledSelect,
    KeyValue,

    Checkbox
  },

  props: {
    node: {
      type:     Object as PropType<EKSNodeGroup>,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          v-model="node.nodegroupName"
          label="Node Group Name"
          :mode="mode"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          v-model.number="node.desiredSize"
          label="Desired ASG size"
          :mode="mode"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model.number="node.minSize"
          label="Minimum ASG Size"
          :mode="mode"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model.number="node.maxSize"
          label="Maximum ASG size"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <!-- //TODO NB kubernetes version dropdown here? Never editable? -->
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          label="Node Instance Role"
          :options="[]"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          label="Launch Template"
          :options="[]"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          label="Template Version"
          :options="[]"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          :mode="mode"
          label="Instance Type"
          :options="[]"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          label="AMI ID"
          :mode="mode"
        />
      </div>
      <div class="col span-3">
        <!-- //TODO NB unitinput? units or number? -->
        <LabeledInput
          label="Node Volume Size"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <!-- //TODO nb multiline? -->
        <LabeledInput
          label="SSH Key"
          :mode="mode"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="GPU Enabled Instance"
        />
      </div>
      <div class="col span-3">
        <!-- //TODO NB disable instance type dropdown when in use -->
        <Checkbox
          :mode="mode"
          label="Request Spot Instances"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          label="User Data"
          :mode="mode"
          type="multiline"
        />
      </div>
      <div class="col span-6">
        <!-- //TODO nb difference between instance resource tags and node group tags...? -->
        <KeyValue
          :mode="mode"
          label="Instance Resource Tags"
          :initial-empty-row="true"
        >
          <template #title>
            <label class="text-label">Instance Resource Tags</label>
          </template>
        </KeyValue>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          label="Group Labels"
          :initial-empty-row="true"
        >
          <template #title>
            <label class="text-label">Group Labels</label>
          </template>
        </KeyValue>
      </div>
      <div class="col span-6">
        <KeyValue
          :mode="mode"
          label="Group Tags"
          :initial-empty-row="true"
        >
          <template #title>
            <label class="text-label">Group Tags</label>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
