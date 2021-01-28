
<script>
import Card from '@/components/Card';
export default {
  components: { Card },
  props:      {
    containers: {
      type:     Array,
      required: true
    },

    primaryName: {
      type:     String,
      required: true
    }
  },

  methods: {
    isPrimary(container) {
      return container.name === this.primaryName;
    },

    remove(container) {
      this.$emit('remove', container);
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('workload.container.selectContainer') }}
    </h3>
    <div class="text-muted">
      {{ t('workload.container.multipleContainers', {name: primaryName}) }}
    </div>
    <div class="container-container">
      <Card v-for="(container, i) in containers" :key="i" :class="{'primary': isPrimary(container)}">
        <template #title>
          {{ container.name }}
        </template>
        <template #body>
          <span v-if="isPrimary(container)">Primary</span>
          <span v-else-if="container._init">Init</span>
          <span v-else>Sidecar</span>
        </template>
        <template #actions>
          <button class="btn btn-sm role-primary mr-10" type="button" @click="$emit('input', container)">
            {{ t('generic.edit') }}
          </button>
          <button v-if="!isPrimary(container)" class="btn btn-sm bg-error" type="button" @click="remove(container)">
            {{ t('generic.remove') }}
          </button>
        </template>
      </Card>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.container-container{
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.primary{
    background-color: var(--tooltip-bg);
}
</style>
