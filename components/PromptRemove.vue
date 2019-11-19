<script>
import { mapState } from 'vuex';
import { get } from '../utils/object';
import Card from '@/components/Card';
export default {
  components: { Card },
  data() {
    return { confirmName: '', error: '' };
  },
  computed:   {
    name() {
      return get(this.toRemove, 'metadata.name');
    },
    kind() {
      const kind = get(this.toRemove, 'kind');

      if (kind) {
        return kind.toLowerCase();
      }

      return 'resource';
    },
    selfLink() {
      return get(this.toRemove, 'links.self');
    },
    needsConfirm() {
      return this.kind === 'namespace' || this.kind === 'stack';
    },
    ...mapState('actionMenu', ['showPromptRemove', 'toRemove'])
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
      this.$store.commit('actionMenu/togglePromptRemove', null);
    },
    remove() {
      if (this.needsConfirm && this.confirmName !== this.name) {
        this.error = 'Resource names do not match';
      } else {
        this.toRemove.remove();
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
      <span slot="title" class="text-default-text">Are you sure?</span>
      <div slot="body">
        <div class="mb-10">
          You are attempting to remove the {{ kind }} <a :href="selfLink">{{ name }}</a>. <span v-if="needsConfirm">Re-enter its name below to confirm:</span>
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
