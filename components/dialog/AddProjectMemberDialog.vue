<script>
import Card from '@/components/Card';
import ProjectMemberEditor from '@/components/form/ProjectMemberEditor';

export default {
  components: {
    Card,
    ProjectMemberEditor
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      member:       {
        permissionGroup: 'member',
        custom:          {},
        userPrincipalId: '',
        projectId:       null,
        roleTemplateIds: []
      }
    };
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

    apply(buttonDone) {
      this.onAdd(this.member);
      this.close();
    }
  }
};
</script>

<template>
  <Card class="prompt-rotate" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="t('addProjectMemberDialog.title')" />

    <div slot="body" class="pl-10 pr-10">
      <ProjectMemberEditor v-model="member" />
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
