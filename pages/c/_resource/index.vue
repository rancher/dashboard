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
};
</script>

<template>
  <div>
    <div class="header">
      <h2>
        {{ schema.attributes.kind }}
      </h2>
      <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary right-action">
        Create
      </nuxt-link>
    </div>

    <ResourceTable :resource="$route.params.resource" :rows="rows" />
  </div>
</template>

<style lang="scss" scoped>
  .header {
    position: relative;
  }

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
