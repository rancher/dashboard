
<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { RadioGroup } from '@components/Form/Radio';
import { Card } from '@components/Card';
import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';
import { DESCRIPTION } from '@shell/config/labels-annotations';

export function canViewClusterPermissionsEditor(store) {
  return !!store.getters['management/schemaFor'](MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING) &&
    !!store.getters['management/schemaFor'](MANAGEMENT.ROLE_TEMPLATE) &&
    !!store.getters['management/schemaFor'](MANAGEMENT.USER);
}

export default {
  emits: ['update:value'],

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
    },

    clusterName: {
      type:    String,
      default: null
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
          key:   'projects-create',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterBackups'),
          key:   'backups-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterCatalogs'),
          key:   'clustercatalogs-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterMembers'),
          key:   'clusterroletemplatebindings-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageNavlinks'),
          key:   'navlinks-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageNodes'),
          key:   'nodes-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageStorage'),
          key:   'storage-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewAllProjects'),
          key:   'projects-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterCatalogs'),
          key:   'clustercatalogs-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterMembers'),
          key:   'clusterroletemplatebindings-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewNodes'),
          key:   'nodes-view',
          value: false
        }
      ],
      permissionGroup: 'member',
      custom:          {},
      roleTemplates:   [],
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
          .filter((permission) => permission.value)
          .map((permission) => permission.key);
      }

      return [this.permissionGroup];
    },
    options() {
      const customRoles = this.customRoles.map((role) => ({
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
    },
    principal() {
      const principalId = this.principalId.replace(/\//g, '%2F');

      return this.$store.dispatch('rancher/find', {
        type: NORMAN.PRINCIPAL,
        id:   this.principalId,
        opt:  { url: `/v3/principals/${ principalId }` }
      }, { root: true });
    },
    customPermissionsUpdate() {
      return this.customPermissions.reduce((acc, customPermissionsItem) => {
        const lockedExist = this.roleTemplates.find((roleTemplateItem) => roleTemplateItem.id === customPermissionsItem.key);

        if (lockedExist.locked) {
          customPermissionsItem['locked'] = true;
          customPermissionsItem['tooltip'] = this.t('members.clusterPermissions.custom.lockedRole');
        }

        return [...acc, customPermissionsItem];
      }, []);
    }
  },

  watch: {
    roleTemplateIds() {
      this.updateBindings();
    }
  },
  methods: {
    async principalProperty() {
      const principal = await this.principal;

      return principal?.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';
    },

    onAdd(principalId) {
      this['principalId'] = principalId;
      this.updateBindings();
    },

    async updateBindings() {
      if (this.principalId) {
        const principalProperty = await this.principalProperty();
        const bindingPromises = this.roleTemplateIds.map((id) => this.$store.dispatch(`rancher/create`, {
          type:                NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
          clusterId:           this.clusterName,
          roleTemplateId:      id,
          [principalProperty]: this.principalId
        }));

        const bindings = await Promise.all(bindingPromises);

        this.$emit('update:value', bindings);
      }
    }
  },
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="cluster-permissions-editor"
  >
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal
          v-focus
          class="mb-20"
          :mode="mode"
          :retain-selection="true"
          data-testid="cluster-member-select"
          @add="onAdd"
        />
      </div>
    </div>

    <Card
      class="m-0"
      :show-highlight-border="false"
      :show-actions="false"
    >
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
          v-model:value="permissionGroup"
          :options="options"
          name="permission-group"
        />
        <div
          v-if="permissionGroup === 'custom'"
          class="custom-permissions ml-20 mt-10"
          :class="{'two-column': useTwoColumnsForCustom}"
        >
          <div
            v-for="(permission, i) in customPermissionsUpdate"
            :key="i"
          >
            <Checkbox
              v-model:value="permission.value"
              :disabled="permission.locked"
              class="mb-5"
              :label="permission.label"
            />
            <i
              v-if="permission.locked"
              v-clean-tooltip="permission.tooltip"
              class="icon icon-lock icon-fw"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
<style lang="scss" scoped>
$detailSize: 11px;

:deep() .type-description {
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
  :deep() .checkbox-label {
    margin-right: 0;
  }
}
</style>
