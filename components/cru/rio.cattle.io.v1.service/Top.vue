<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { NameNsDescription, LabeledInput },

  props: {
    isSidecar: {
      type:    Boolean,
      default: false
    },
    nameResource: {
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
          v-model="nameResource.name"
          :mode="mode"
          label="Container Name"
          :required="true"
        />
      </template>
      <template v-if="!isSidecar" #right>
        <LabeledInput
          v-model="value.spec.scale"
          type="number"
          min="0"
          label="Scale"
        />
      </template>
      <template v-if="mode === 'edit'" #namespace>
        <LabeledInput
          v-model="value.spec.version"
          :mode="mode"
          label="Version"
          :required="true"
        />
      </template>
    </NameNsDescription>

    <p>
      --scale (global),
      --image, --image-pull-policy,
      --memory, --cpus
    </p>
  </div>
</template>
