<script>
import Card from '@shell/components/Card';
import ClusterPermissionsEditor from '@shell/components/form/Members/ClusterPermissionsEditor';

export default {
  components: {
    Card,
    ClusterPermissionsEditor
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { bindings: [] };
  },

  computed: {
    onAdd() {
      return this.resources[0];
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    apply() {
      this.onAdd(this.bindings);
      this.close();
    },
  }
};
</script>

<template>
  <Card class="prompt-rotate" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="t('addClusterMemberDialog.title')" />

    <div slot="body" class="pl-10 pr-10">
      <ClusterPermissionsEditor v-model="bindings" :use-two-columns-for-custom="true" />
    </div>

    <div slot="actions" class="buttons">
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>

      <button
        class="btn role-primary"
        @click="apply"
      >
        {{ t('generic.add') }}
      </button>
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-rotate {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>
