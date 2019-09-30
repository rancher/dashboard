<script>
import CreateEditView from '@/mixins/create-edit-view';
import { FRIENDLY } from '@/pages/rio/_resource/index';
import { MODE, _VIEW, _EDIT } from '@/config/query-params';

export default {
  mixins:     { CreateEditView },
  watchQuery: [MODE],

  data() {
    const mode = this.$route.query.mode || _VIEW;

    return { mode };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    isEdit() {
      return this.mode === _EDIT;
    },

    type() {
      return FRIENDLY[this.resource].type;
    },

    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    cruComponent() {
      return () => import(`@/components/cru/${ this.type }`);
    },

    typeDisplay() {
      return FRIENDLY[this.resource].singular;
    },
  },

  async asyncData(ctx) {
    const { resource, namespace, id } = ctx.params;
    const fqid = `${ namespace }/${ id }`;
    const type = FRIENDLY[resource].type;

    const obj = await ctx.store.dispatch('cluster/find', { type, id: fqid });

    const model = await ctx.store.dispatch('cluster/clone', obj);

    return {
      resource,
      model,
      originalModel: obj,
    };
  },

  methods: {
    showActions() {
      this.$store.commit('selection/show', {
        resources: this.originalModel,
        elem:      this.$refs.actions,
      });
    },
  }
};
</script>

<template>
  <div>
    <header>
      <h1><span v-if="isEdit">Edit</span> {{ originalModel.nameDisplay }}</h1>
      <div v-if="isView" class="actions">
        <button ref="actions" class="btn btn-sm bg-primary actions" @click="showActions">
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <component
      :is="cruComponent"
      v-model="model"
      :original-value="originalModel"
      :done-route="doneRoute"
      :done-params="doneParams"
      :namespace-suffix-on-create="true"
      :type-label="typeDisplay"
      :mode="mode"
    />
  </div>
</template>
