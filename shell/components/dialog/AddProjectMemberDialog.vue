<script>
import Card from '@shell/components/Card';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor';
import { NORMAN } from '@shell/config/types';

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
        principalId:     '',
        projectId:       null,
        roleTemplateIds: []
      }
    };
  },

  computed: {
    onAdd() {
      return this.resources[0];
    },

    principal() {
      const principalId = this.member.principalId.replace(/\//g, '%2F');

      return this.$store.dispatch('rancher/find', {
        type: NORMAN.PRINCIPAL,
        id:   this.member.principalId,
        opt:  { url: `/v3/principals/${ principalId }` }
      }, { root: true });
    },
  },

  methods: {
    async principalProperty() {
      const principal = await this.principal;

      return principal.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';
    },

    close() {
      this.$emit('close');
    },

    async apply() {
      this.onAdd(await this.createBindings());
      this.close();
    },

    async createBindings() {
      const principalProperty = await this.principalProperty();
      const promises = this.member.roleTemplateIds.map(roleTemplateId => this.$store.dispatch(`rancher/create`, {
        type:                NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateId,
        [principalProperty]: this.member.principalId,
        projectId:           this.member.projectId,
      }));

      return Promise.all(promises);
    }
  }
};
</script>

<template>
  <Card class="prompt-rotate" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="t('addProjectMemberDialog.title')" />

    <div slot="body" class="pl-10 pr-10">
      <ProjectMemberEditor v-model="member" :use-two-columns-for-custom="true" />
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
