
<script>
import CreateEditView from '@/mixins/create-edit-view';
import SelectPrincipal from '@/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@/config/types';
import RadioGroup from '@/components/form/RadioGroup';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import Checkbox from '@/components/form/Checkbox';
import { DESCRIPTION } from '@/config/labels-annotations';

export default {
  components: {
    Card,
    Checkbox,
    Loading,
    RadioGroup,
    SelectPrincipal
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Array,
      required: true
    },

    useTwoColumnsForCustom: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    const [, roleTemplates] = await Promise.all([
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER }),
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE })
    ]);

    this.roleTemplates = roleTemplates;
  },
  data() {
    return {
      customPermissions: [
        {
          label: this.t('members.clusterPermissions.createProjects'),
          key:      'projects-create',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterBackups'),
          key:      'backups-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterCatalogs'),
          key:      'clustercatalogs-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterMembers'),
          key:      'clusterroletemplatebindings-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageNavlinks'),
          key:   'navlinks-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageNodes'),
          key:      'nodes-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageStorage'),
          key:      'storage-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewAllProjects'),
          key:      'projects-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterCatalogs'),
          key:      'clustercatalogs-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterMembers'),
          key:      'clusterroletemplatebindings-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewNodes'),
          key:      'nodes-view',
          value: false
        }
      ],
      permissionGroup: 'member',
      custom:          {},
      roleTemplates:     [],
      principalId:     '',
      bindings:        []
    };
  },
  computed: {
    customRoles() {
      return this.roleTemplates
        .filter((role) => {
          return !role.builtin && !role.external && !role.hidden && role.context === 'cluster';
        });
    },
    roleTemplateIds() {
      if (this.permissionGroup === 'owner') {
        return ['cluster-owner'];
      }

      if (this.permissionGroup === 'member') {
        return ['cluster-member'];
      }

      if (this.permissionGroup === 'custom') {
        return this.customPermissions
          .filter(permission => permission.value)
          .map(permission => permission.key);
      }

      return [this.permissionGroup];
    },
    options() {
      const customRoles = this.customRoles.map(role => ({
        label:       role.nameDisplay,
        description: role.description || role.metadata?.annotations?.[DESCRIPTION] || this.t('members.clusterPermissions.noDescription'),
        value:       role.id
      }));

      return [
        {
          label:       this.t('members.clusterPermissions.owner.label'),
          description: this.t('members.clusterPermissions.owner.description'),
          value:       'owner'
        },
        {
          label:       this.t('members.clusterPermissions.member.label'),
          description: this.t('members.clusterPermissions.member.description'),
          value:       'member'
        },
        ...customRoles,
        {
          label:       this.t('members.clusterPermissions.custom.label'),
          description: this.t('members.clusterPermissions.custom.description'),
          value:       'custom'
        }
      ];
    }
  },
  watch: {
    roleTemplateIds() {
      this.updateBindings();
    }
  },
  methods: {
    onAdd(principalId) {
      this.$set(this, 'principalId', principalId);
      this.updateBindings();
    },

    async updateBindings() {
      const bindingPromises = this.roleTemplateIds.map(id => this.$store.dispatch(`management/create`, {
        type:              MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
        clusterName:       this.$store.getters['currentCluster'].id,
        roleTemplateName:  id,
        principalName:    this.principalId
      }));

      const bindings = await Promise.all(bindingPromises);

      this.$emit('input', bindings);
    }
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="cluster-permissions-editor">
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal class="mb-20" :mode="mode" :retain-selection="true" @add="onAdd" />
      </div>
    </div>

    <Card class="m-0" :show-highlight-border="false" :show-actions="false">
      <template v-slot:title>
        <div class="type-title">
          <h3>{{ t('members.clusterPermissions.label') }}</h3>
          <div class="type-description">
            {{ t('members.clusterPermissions.description') }}
          </div>
        </div>
      </template>
      <template v-slot:body>
        <RadioGroup
          v-model="permissionGroup"
          :options="options"
          name="permission-group"
        />
        <div v-if="permissionGroup === 'custom'" class="custom-permissions ml-20 mt-10" :class="{'two-column': useTwoColumnsForCustom}">
          <Checkbox v-for="permission in customPermissions" :key="permission.key" v-model="permission.value" class="mb-5" :label="permission.label" />
        </div>
      </template>
    </Card>
  </div>
</template>
<style lang="scss" scoped>
$detailSize: 11px;

::v-deep .type-description {
    font-size: $detailSize;
}

label.radio {
  font-size: 16px;
}

.custom-permissions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  &.two-column {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
