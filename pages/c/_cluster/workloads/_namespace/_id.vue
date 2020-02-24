<script>
import Workload from '@/edit/workload';
export default {
  components: { Workload },
  async asyncData(ctx) {
    const { cluster, id, namespace } = ctx.params;
    const { mode = 'create', type } = ctx.query;

    let value;
    let obj;

    if (mode === 'create') {
      const data = { type };

      obj = await ctx.store.dispatch('cluster/create', data);
    } else {
      const fqid = `${ namespace }/${ id }`;

      obj = await ctx.store.dispatch('cluster/find', { type, id: fqid });
    }
    // type = obj.type;

    return {
      obj, value, type, mode
    };
  }
};
</script>

<template>
  <div>
    <header>
      <h1 v-trim-whitespace>
        <span v-if="mode === 'edit'">Edit Workload:&nbsp;</span>
        <span v-else-if="mode === 'stage'">Stage from Workload:&nbsp;</span>
        <span v-else-if="mode === 'clone'">Clone from Workload:&nbsp;</span>
        <nuxt-link
          v-else
          v-trim-whitespace
          :to="parentLink"
        >
          Workload:&nbsp;
        </nuxt-link>{{ obj.id }}
      </h1>
      <!-- <div v-if="isView" class="actions">
        <button ref="actions" type="button" class="btn btn-sm role-multi-action actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div> -->
    </header>
    <Workload :value="obj" :mode="mode" :cluster="cluster" />
  </div>
</template>
