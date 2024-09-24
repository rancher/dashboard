<script>
import { Card } from '@components/Card';
import ClusterPermissionsEditor from '@shell/components/form/Members/ClusterPermissionsEditor';

export default {
  emits: ['close'],

  components: {
    Card,
    ClusterPermissionsEditor
  },

  props: {
    onAdd: {
      type:    Function,
      default: () => {}
    }
  },

  data() {
    return { bindings: [] };
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
  <Card
    class="prompt-rotate"
    :show-highlight-border="false"
  >
    <template #title>
      <h4
        v-clean-html="t('addClusterMemberDialog.title')"
        class="text-default-text"
      />
    </template>

    <template #body>
      <div class="pl-10 pr-10">
        <ClusterPermissionsEditor
          v-model:value="bindings"
          :use-two-columns-for-custom="true"
        />
      </div>
    </template>

    <template #actions>
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>

        <button
          class="btn role-primary"
          @click="apply"
        >
          {{ t('generic.add') }}
        </button>
      </div>
    </template>
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
