
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';
import { _VIEW } from '@/config/query-params';
import Loading from '@/components/Loading';

export default {
  components: {
    Checkbox,
    Loading,
  },
  props:      {
    mode: {
      type:    String,
      default: _VIEW,
    },
    principalId: {
      type:     String,
      default: ''
    },
  },
  async fetch() {
    try {
      this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      if (!this.sortedRoles) {
        this.sortedRoles = {
          global:  {},
          builtin: {},
          custom:  {}
        };

        this.allRoles.forEach((role) => {
          const type = this.getRoleType(role);

          if (type) {
            this.sortedRoles[type][role.id] = {
              label:       this.t(`rbac.globalRoles.role.${ role.id }.label`) || role.displayName,
              description: this.t(`rbac.globalRoles.role.${ role.id }.detail`) || role.description || this.t(`rbac.globalRoles.unknownRole.detail`),
              id:          role.id,
              role,
            };
          }
        });

        // Moving this out into the watch has issues....
        this.globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

        this.update();
      }
    } catch (e) { }
  },
  data() {
    return {
      globalPermissions: [
        'admin',
        'restricted-admin',
        'user',
        'user-base',
      ],
      user:               null, // TODO: Populate in edit user mode
      globalRoleBindings: null,
      sortedRoles:        null,
      selectedRoles:      [],
      roleChanges:        {}
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      this.update();
    }
  },
  methods: {
    getRoleType(role) {
      if (this.globalPermissions.find(p => p === role.id)) {
        return 'global';
      } else if (role.hidden) {
        return null;
      } else if (role.builtin) {
        return 'builtin';
      } else {
        return 'custom';
      }
    },
    getUnique(...ids) {
      return `${ this.principalId }-${ ids.join('-') }`;
    },
    update() {
      if (!this.principalId) {
        return;
      }

      this.selectedRoles = [];
      this.startingSelectedRoles = [];

      const boundRoles = this.globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      Object.entries(this.sortedRoles).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          const boundRole = boundRoles.find(boundRole => boundRole.globalRoleName === roleId);

          if (!!boundRole) {
            this.selectedRoles.push(roleId);
            this.startingSelectedRoles.push({
              roleId,
              bindingId: boundRole.id
            });
          }
        });
      });

      // TODO: If in create user mode... apply default selection using role.newUserDefault
      // TODO: If in create/edit user mode... apply validation as per rancher/ui lib/global-admin/addon/components/form-global-roles/component.js
      // Should validation come in via validationErrors property on model?
    },
    checkboxChanged() {
      const addRoles = this.selectedRoles
        .filter(selected => !this.startingSelectedRoles.find(startingRole => startingRole.roleId === selected));
      const removeBindings = this.startingSelectedRoles
        .filter(startingRole => !this.selectedRoles.find(selected => selected === startingRole.roleId))
        .map(startingRole => startingRole.bindingId);

      this.roleChanges = {
        initialRoles: this.startingSelectedRoles,
        addRoles,
        removeBindings
      };
      this.$emit('changed', this.roleChanges);
    },
    async saveAddedRoles() {
      const newBindings = await Promise.all(this.roleChanges.addRoles.map(role => this.$store.dispatch(`management/create`, {
        type:               RBAC.GLOBAL_ROLE_BINDING,
        metadata:           { generateName: `grb-` },
        globalRoleName:     role,
        groupPrincipalName: this.principalId,
      })));

      await Promise.all(newBindings.map(newBinding => newBinding.save()));
    },
    async saveRemovedRoles() {
      const existingBindings = await Promise.all(this.roleChanges.removeBindings.map(bindingId => this.$store.dispatch('management/find', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        id:   bindingId
      })));

      await Promise.all(existingBindings.map(existingBinding => existingBinding.remove()));
    },
    async save() {
      // Ensure roles are added before removed (in case by removing one user is unable to add another)
      await this.saveAddedRoles();
      await this.saveRemovedRoles();
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <form v-if="selectedRoles">
      <div v-for="(sortedRole, type) in sortedRoles" :key="getUnique(type)" class="role-group mb-10">
        <template v-if="Object.keys(sortedRole).length">
          <h2>{{ t(`rbac.globalRoles.types.${type}.label`) }}</h2>
          <div class="type-description mb-10">
            {{ t(`rbac.globalRoles.types.${type}.detail`, { type: 'Application', isUser: !!user }) }}
          </div>
          <div class="checkbox-section" :class="'checkbox-section--' + type">
            <div v-for="(role, roleId) in sortedRoles[type]" :key="getUnique(type, roleId)" class="checkbox mb-10 mr-10">
              <Checkbox
                :key="getUnique(type, roleId, 'checkbox')"
                v-model="selectedRoles"
                :value-when-true="roleId"
                :label="role.label"
                :mode="mode"
                @input="checkboxChanged"
              />
              <div class="description">
                {{ role.description }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </form>
  </div>
</template>

<style lang='scss' scoped>
  $detailSize: 11px;
  .role-group {
    .type-description {
      font-size: $detailSize;
    }
    .checkbox-section {
      display: grid;

      grid-template-columns: repeat(3, 1fr);

      &--global {
        grid-template-columns: 100%;
      }

      .checkbox {
        display: flex;
        flex-direction: column;

        .description {
          font-size: $detailSize;
          margin-top: 5px;
        }
      }
    }
  }
</style>
