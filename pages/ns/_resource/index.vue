<script>
import ResourceTable from '@/components/ResourceTable';

export default {
  components: { ResourceTable },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](this.resource);
    },
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;

    return ctx.store.dispatch('v1/findAll', { type: resource }).then((rows) => {
      return {
        resource,
        rows
      };
    });
  },

  methods: {
    add() {
    },
  },
}; </script>

<template>
  <div>
    <h2>
      {{ schema.attributes.kind }}
      <button type="button" class="btn btn-sm bg-primary right-action" @click="add">
        Add
      </button>
    </h2>
    <ResourceTable :resource="$route.params.resource" :rows="rows" />
  </div>
</template>

<style lang="scss" scoped>
  H2 {
    position: relative;
    margin: 0 0 20px 0;
  }

  .right-action {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
