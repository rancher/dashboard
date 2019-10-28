<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Ports from '@/components/cru/rio.cattle.io.v1.service/Ports';

const imagePullPolicyChoices = [
  { value: 'Always', label: 'Always' },
  { value: 'IfNotPresent', label: 'If not present on the node' },
  { value: 'Never', label: 'Never' },
];

export default {
  components: {
    NameNsDescription, LabeledInput, LabeledSelect, Ports,
  },

  props: {
    isSidecar: {
      type:    Boolean,
      default: false
    },
    nameResource: {
      type:     Object,
      required: true,
    },
    spec: {
      type:     Object,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    }
  },

  data() {
    const spec = this.spec;
    const buildImage = !!(spec && spec.build && spec.build.repo);

    return {
      buildImage,
      imagePullPolicyChoices
    };
  },

  watch: {
    buildImage(neu) {
      if ( neu ) {
        delete this.spec.image;
        this.spec.build = this.spec.build || {};
      } else {
        delete this.spec.build;
        this.spec.image = '';
      }
    }
  }
};
</script>
<template>
  <div>
    <NameNsDescription
      :value="value"
      :mode="mode"
      :name-label="isSidecar ? 'Container Name' : 'Service Name'"
      :three-column="!isSidecar"
    >
      <template v-if="isSidecar" #name>
        <LabeledInput
          key="sidecarName"
          v-model="nameResource.name"
          :mode="mode"
          label="Container Name"
          :required="true"
        />
      </template>
      <template v-if="!isSidecar" #right>
        <LabeledInput
          key="scale"
          v-model.number="spec.replicas"
          :mode="mode"
          type="number"
          min="0"
          label="Scale"
        />
      </template>
      <template v-if="mode === 'edit'" #namespace>
        <LabeledInput
          key="version"
          v-model="spec.version"
          :mode="mode"
          label="Version"
          :required="true"
        />
      </template>
    </NameNsDescription>
    
    <h4>Image</h4>
    <div class="row">
      <div class="col span-3">
        <div>
          <label class="radio">
            <input v-model="buildImage" type="radio" :value="false" />
            Use an existing Docker image
          </label>
        </div>
        <div>
          <label class="radio">
            <input v-model="buildImage" type="radio" :value="true" />
            Build from Dockerfile in a repositiory
          </label>
        </div>
      </div>

      <div v-if="buildImage" class="col span-9">
        <div class="row">
          <div class="col span-4">
            <LabeledInput v-model="spec.build.repo" :mode="mode" label="Repo URL" :required="true" />
          </div>
          <div class="col span-4">
            <LabeledInput v-model="spec.build.branch" :mode="mode" label="Branch" />
          </div>
          <div class="col span-4">
            <LabeledInput v-model="spec.build.dockerFile" :mode="mode" label="Dockerfile" />
          </div>

          <div class="row">
            <label type="checkbox"><input v-model="spec.build.stageOnly" type="checkbox"> Stage only</label>
            <label type="checkbox"><input v-model="spec.build.enablePr" type="checkbox"> Create a new service for each Pull Request</label>
          </div>
        </div>
      </div>
      <div v-else class="col span-9">
        <div class="row">
          <div class="col span-6">
            <LabeledInput v-model="spec.image" :mode="mode" label="Image" :required="true" />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="spec.imagePullPolicy"
              :mode="mode"
              :options="imagePullPolicyChoices"
              label="Image Pull Policy"
            />
          </div>
        </div>
      </div>
    </div>

    <Ports
      :spec="spec"
      :name-resource="nameResource"
      :is-sidecar="isSidecar"
      :mode="mode"
      :pad-left="false"
    />

  </div>
</template>
