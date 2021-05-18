<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import { MANAGEMENT, NORMAN } from '@/config/types';
import { PROJECT_ID } from '@/config/query-params';
import ProjectMemberEditor from '@/components/form/ProjectMemberEditor';

export default {
  components: {
    CruResource,
    ProjectMemberEditor,
  },

  mixins: [CreateEditView],
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
    this.$set(this.binding, 'projectId', this.binding.projectId || this.projects[0]?.id.replace('/', ':'));
  },
  data() {
    return {
      binding:         {
        permissionGroup: 'member',
        custom:          {},
        userPrincipalId: '',
        projectId:       this.$route.query[PROJECT_ID],
      },
    };
  },
  computed: {
    doneLocationOverride() {
      if (this.$route.query[PROJECT_ID]) {
        return {
          name:   'c-cluster-product-resource-id',
          params: {
            resource: MANAGEMENT.PROJECT,
            id:       this.$route.query[PROJECT_ID].replace(':', '/')
          }
        };
      }

      return this.value.listLocation;
    },
  },
  methods: {
    onAdd(userId) {
      this.$set(this, 'userPrincipalId', userId);
    },
    async saveOverride() {
      const asyncBindings = this.binding.roleTemplateIds.map(roleTemplateId => this.$store.dispatch(`rancher/create`, {
        type:                  NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateId,
        userPrincipalId:       this.binding.userPrincipalId,
        projectId:             this.binding.projectId,
        projectRoleTemplateId: '',
        subjectKind:           'User',
        userId:                ''
      }));

      const bindings = await Promise.all(asyncBindings);

      await Promise.all(bindings.map(binding => binding.save()));
      await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING, opt: { force: true } });

      this.$router.replace(this.doneLocationOverride);
    }
  }
};

</script>

<template>
  <CruResource
    class="cluster-role-template-binding"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :cancel-event="true"
    :validation-passed="!!binding.userPrincipalId && !!binding.projectId"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <ProjectMemberEditor v-model="binding" />
  </CruResource>
</template>
<style lang="scss" scoped>
label.radio {
  font-size: 16px;
}

.custom-permissions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
</style>
