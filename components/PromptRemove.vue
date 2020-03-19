<script>
import { mapState } from 'vuex';
import { get } from '@/utils/object';
import { NAMESPACE, RIO } from '@/config/types';
import Card from '@/components/Card';

export default {
  components: { Card },
  data() {
    return { confirmName: '', error: '' };
  },
  computed:   {
    names() {
      return this.toRemove.map(obj => obj.nameDisplay);
    },

    type() {
      const schema = this.toRemove[0]?.schema;

      if ( !schema ) {
        return `resource${ this.toRemove.length === 1 ? '' : 's' }`;
      }

      if ( this.toRemove.length > 1 ) {
        return this.$store.getters['type-map/pluralLabelFor'](schema);
      } else {
        return this.$store.getters['type-map/singularLabelFor'](schema);
      }
    },

    selfLinks() {
      return this.toRemove.map((resource) => {
        return get(resource, 'links.self');
      });
    },

    needsConfirm() {
      const first = this.toRemove[0];

      if ( !first ) {
        return false;
      }
      const type = first.type;

      return (type === NAMESPACE || type === RIO.STACK) && this.toRemove.length === 1;
    },

    ...mapState('action-menu', ['showPromptRemove', 'toRemove'])
  },

  watch:    {
    showPromptRemove(show) {
      if (show) {
        this.$modal.show('promptRemove');
      } else {
        this.$modal.hide('promptRemove');
      }
    }
  },

  methods: {
    close() {
      this.$store.commit('action-menu/togglePromptRemove');
    },

    remove() {
      if (this.needsConfirm && this.confirmName !== this.names[0]) {
        this.error = 'Resource names do not match';
      } else {
        this.toRemove.map(resource => resource.remove());
        this.confirmName = '';
        this.close();
      }
    }
  }
};
</script>

<template>
  <modal
    name="promptRemove"
    :width="350"
    :height="260"
  >
    <Card :style="{border:'none'}">
      <h4 slot="title" class="text-default-text">
        Are you sure?
      </h4>
      <div slot="body">
        <div class="mb-10">
          You are attempting to remove the {{ type }} <template v-for="(resource, i) in names">
            <a :key="resource" :href="selfLinks[i]">{{ resource }}</a><span v-if="i<toRemove.length-1" :key="resource+1">{{ i === toRemove.length-2 ? ', and ' : ', ' }}</span>
          </template>. <span v-if="needsConfirm">Re-enter its name below to confirm:</span>
        </div>
        <input v-if="needsConfirm" id="confirm" v-model="confirmName" type="text" />
        <span class="text-error"> {{ error }}</span>
      </div>
      <template slot="actions">
        <button class="btn role-secondary" @click="close">
          Cancel
        </button>
        <button class="btn bg-error" @click="remove">
          Delete
        </button>
      </template>
    </Card>
  </modal>
</template>

<style>
    #confirm {
        width: 90%;
        margin-left: 3px;
    }
</style>
