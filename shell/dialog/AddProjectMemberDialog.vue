<script>
import { Card } from '@components/Card';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { NORMAN } from '@shell/config/types';

export default {
  components: {
    Card,
    ProjectMemberEditor,
    AsyncButton,
    Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    },

    onAdd: {
      type:    Function,
      default: () => {}
    },

    projectId: {
      type:    String,
      default: null
    },

    saveInModal: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      member: {
        permissionGroup: 'member',
        custom:          {},
        principalId:     '',
        roleTemplateIds: []
      },
      error: null
    };
  },

  computed: {
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

      return principal?.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';
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
        projectId:           this.projectId,
      }));

      return Promise.all(promises);
    },

    saveBindings(btnCB) {
      this.error = null;
      this.createBindings()
        .then((bindings) => {
          return Promise.all(bindings.map(b => b.save()));
        })
        .then(() => {
          btnCB(true);
          setTimeout(this.close, 500);
        })
        .catch((err) => {
          this.error = err;
          btnCB(false);
        });
    }
  }
};
</script>

<template>
  <Card
    class="prompt-rotate"
    :show-highlight-border="false"
    :sticky="true"
  >
    <h4
      slot="title"
      class="text-default-text"
      v-html="t('addProjectMemberDialog.title')"
    />

    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <Banner
        v-if="error"
        color="error"
      >
        {{ error }}
      </Banner>
      <ProjectMemberEditor
        v-model="member"
        :use-two-columns-for-custom="true"
      />
    </div>

    <div
      slot="actions"
      class="buttons"
    >
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>

      <AsyncButton
        v-if="saveInModal"
        mode="create"
        @click="cb=>saveBindings(cb)"
      />

      <button
        v-else
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

<style lang="scss">
  .card-container {
    border: 1px solid var(--border);
    box-shadow: none;
  }
</style>
