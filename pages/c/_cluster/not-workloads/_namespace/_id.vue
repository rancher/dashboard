<script>
import Workload from '@/detail/workload';
import ResourceYaml from '@/components/ResourceYaml';
import { createYaml } from '@/utils/create-yaml';
import { WORKLOAD_TYPES, SCHEMA } from '@/config/types';
import {
  MODE,
  EDIT_YAML, _VIEW
} from '@/config/query-params';

export default {
  components: { Workload, ResourceYaml },

  watchQuery: [MODE, EDIT_YAML],

  computed:   {
    isView() {
      return this.mode === _VIEW;
    }
  },

  async asyncData(ctx) {
    const { id, namespace } = ctx.params;
    const { mode = 'view', type = WORKLOAD_TYPES.DEPLOYMENT } = ctx.query;

    const asYaml = !!Object.keys(ctx.query).includes('as-yaml');

    let value;
    let obj;

    if (mode === 'create') {
      const data = { type };

      obj = await ctx.store.dispatch('cluster/create', data);
    } else {
      const fqid = `${ namespace }/${ id }`;

      obj = await ctx.store.dispatch('cluster/find', { type, id: fqid });
    }
    const schemas = ctx.store.getters['cluster/all'](SCHEMA);
    const yaml = createYaml(schemas, type, obj);

    return {
      obj, value, type, mode, asYaml, yaml
    };
  },

  methods: {
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.obj,
        elem:      this.$refs.actions,
      });
    },
  }
};
</script>

<template>
  <ResourceYaml
    v-if="asYaml"
    :obj="obj"
    :value="yaml"
    :done-route="doneRoute"
  />
  <div v-else>
    <header>
      <h1 v-trim-whitespace class="mb-20">
        <span v-if="mode === 'edit'">Edit Workload:&nbsp;</span>
        <span v-else-if="mode === 'stage'">Stage from Workload:&nbsp;</span>
        <span v-else-if="mode === 'clone'">Clone from Workload:&nbsp;</span>
        <nuxt-link
          v-else
          v-trim-whitespace
          :to="''"
        >
          Workload:&nbsp;
        </nuxt-link>{{ obj.id }}
      </h1>
      <div v-if="isView" class="actions">
        <button
          ref="actions"
          aria-haspopup="true"
          aria-expanded="false"
          type="button"
          class="btn btn-sm role-multi-action actions"
          @click="showActions"
        >
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <Workload
      :value="obj"
      done-route="c-cluster-workloads"
      :done-params="{}"
      :mode="mode"
      :namespace-suffix-on-create="false"
    />
  </div>
</template>
