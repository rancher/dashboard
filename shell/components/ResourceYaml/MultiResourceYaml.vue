<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true,
    },

    relatedResources: {
      type:     Array,
      required: true,
    },
  },
};
</script>

<template>
  <div class="multi-resource-yaml">
    <ul>
      <li
        v-for="(resource, index) in relatedResources"
        :key="index"
      >
        {{ resource.metadata.name }} ({{ resource.kind }})
      </li>
    </ul>
  </div>
</template>
