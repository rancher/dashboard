<script>
import { Card } from '@components/Card';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { NORMAN } from '@shell/config/types';
import { _EDIT } from '@shell/config/query-params';

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

    value: {
      type:    Object,
      default: null
    },

    saveInModal: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const d = {
      member: {
        permissionGroup: 'member',
        custom:          {},
        principalId:     '',
        roleTemplateIds: []
      },
      error: null,
      mode:  _EDIT
    };

    return d;
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
      const { projectId } = this.value;
      const principalProperty = await this.principalProperty();
      const toRemoved = [];
      const toSaved = [];
      const roleTemplateId = this.member.roleTemplateIds.find(rtId => rtId === this.value.roleTemplateId);

      if (roleTemplateId) {
        toSaved.push(...this.member.roleTemplateIds.filter(rtId => rtId !== this.value.roleTemplateId));
      } else {
        toRemoved.push(this.value);
        toSaved.push(...this.member.roleTemplateIds);
      }
      const roleTemplates = await Promise.all(toSaved.map(roleTemplateId => this.$store.dispatch(`rancher/create`, {
        type:                NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateId,
        [principalProperty]: this.member.principalId,
        projectId,
      })));

      return { toRemoved, toSaved: roleTemplates };
    },

    async saveBindings(btnCB) {
      this.error = null;
      try {
        const { toRemoved, toSaved } = await this.createBindings();

        await Promise.all(toSaved.map(rt => rt.save()));
        await Promise.all(toRemoved.map(binding => binding.remove()));
        btnCB(true);
        setTimeout(this.close, 500);
      } catch (err) {
        this.error = err;
        btnCB(false);
      }
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
      v-clean-html="t('editProjectMemberDialog.title')"
      class="text-default-text"
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
        :mode="mode"
        :use-two-columns-for-custom="true"
        :init-value="value"
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
        :mode="mode"
        @click="cb=>saveBindings(cb)"
      />

      <button
        v-else
        class="btn role-primary"
        @click="apply"
      >
        {{ t('generic.save') }}
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
