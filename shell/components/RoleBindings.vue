<script>
import { RBAC as RBAC_LABELS } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';
import { RBAC, MANAGEMENT } from '@shell/config/types';
import { _CONFIG, _DETAIL, _EDIT, _VIEW } from '@shell/config/query-params';
import { findBy, removeAt, removeObject } from '@shell/utils/array';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export const SCOPE_NAMESPACE = 'Role';
export const SCOPE_CLUSTER = 'ClusterRole';
// export const SCOPE_GLOBAL = 'GlobalRole';

export default {
  components: {
    Loading, LabeledSelect, SortableTable
  },

  props: {
    registerAfterHook: {
      type:    Function,
      default: null,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    as: {
      type:    String,
      default: _CONFIG,
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    roleScope: {
      type:     String,
      required: true,
      validator(val) {
        return [SCOPE_NAMESPACE, SCOPE_CLUSTER].includes(val);
      }
    },

    bindingScope: {
      type:     String,
      required: true,
      validator(val) {
        return [SCOPE_NAMESPACE, SCOPE_CLUSTER].includes(val);
      }
    },

    namespace: {
      type:    String,
      default: null,
    },

    filterRoleKey: {
      type:    String,
      default: RBAC_LABELS.PRODUCT
    },

    filterRoleValue: {
      type:    String,
      default: null,
    },
  },

  async fetch() {
    const hash = { allUsers: this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER }) };
    const inStore = this.inStore;

    if ( this.roleScope === SCOPE_NAMESPACE ) {
      hash.allRoles = this.$store.dispatch(`${ inStore }/findAll`, { type: RBAC.ROLE });
    } else if ( this.roleScope === SCOPE_CLUSTER ) {
      hash.allRoles = this.$store.dispatch(`${ inStore }/findAll`, { type: RBAC.CLUSTER_ROLE });
    // } else if ( this.roleScope === SCOPE_GLOBAL ) {
    // hash.allRoles = this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE });
    } else {
      throw new Error('Unknown roleScope');
    }

    if ( this.bindingScope === SCOPE_NAMESPACE ) {
      hash.allBindings = this.$store.dispatch(`${ inStore }/findAll`, { type: RBAC.ROLE_BINDING });
    } else if ( this.bindingScope === SCOPE_CLUSTER ) {
      hash.allBindings = this.$store.dispatch(`${ inStore }/findAll`, { type: RBAC.CLUSTER_ROLE_BINDING });
    // } else if ( this.bindingScope === SCOPE_GLOBAL ) {
    // hash.allBindings = this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE_BINDING });
    } else {
      throw new Error('Unknown scope');
    }

    const out = await allHash(hash);

    for ( const key in out ) {
      this[key] = out[key];
    }

    this.readExistingBindings();
  },

  data() {
    return {
      allRoles:    null,
      allBindings: null,
      allUsers:    null,
      rows:        null,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    showDetail() {
      return this.as === _DETAIL;
    },

    detailHeaders() {
      return [
        {
          name:     'type',
          labelKey: 'tableHeaders.type',
          value:    'subjectKind',
          sort:     'subjectKind',
          search:   'subjectKind',
        },
        {
          name:     'subject',
          labelKey: 'tableHeaders.subject',
          value:    'userObj.labelForSelect',
          sort:     'userObj.labelForSelect',
          search:   'userObj.labelForSelect',
        },
        {
          name:     'role',
          labelKey: 'tableHeaders.role',
          value:    'roleObj.nameWithinProduct',
          sort:     'roleObj.nameWithinProduct',
          search:   'roleObj.nameWithinProduct',
        },
      ];
    },

    userOptions() {
      return this.allUsers.filter((x) => {
        return !x.isSystem;
      }).map((x) => {
        return {
          label: x.labelForSelect,
          value: x.id,
        };
      });
    },

    roleOptions() {
      return this.roles.map((x) => {
        return { label: x.nameWithinProduct, value: x.name };
      });
    },

    roles() {
      const all = this.allRoles;

      if ( !this.filterRoleKey || !this.filterRoleValue ) {
        return all;
      }

      const out = all.filter((role) => {
        return role.metadata?.labels?.[this.filterRoleKey] === this.filterRoleValue;
      });

      return out;
    },

    existingBindings() {
      const roles = this.roles.map(x => x.name);

      const out = this.allBindings.filter((binding) => {
        if ( binding.roleRef.kind !== this.roleScope || !binding.roleRef?.name) {
          return false;
        }

        if ( this.bindingScope === SCOPE_NAMESPACE && binding.metadata?.namespace !== this.namespace ) {
          return false;
        }

        return roles.includes(binding.roleRef.name);
      });

      return out;
    },

    unremovedRows() {
      return this.rows.filter(x => x.remove !== true);
    },
  },

  created() {
    if ( this.mode !== _VIEW ) {
      this.registerAfterHook(this.saveRoleBindings, 'saveRoleBindings');
    }
  },

  methods: {
    readExistingBindings() {
      this.rows = this.existingBindings.map((binding) => {
        for ( let i = 0 ; i < binding.subjects.length ; i++ ) {
          const subject = binding.subjects[i];

          // We have no way to do groups right now...
          if ( subject.kind !== 'User' ) {
            continue;
          }

          return {
            subjectKind: subject.kind,
            subject:     subject.name,
            userObj:     findBy(this.allUsers, 'id', subject.name),
            roleKind:    binding.roleRef.kind,
            role:        binding.roleRef.name,
            roleObj:     findBy(this.allRoles, 'id', binding.roleRef.name),
            existing:    binding,
            existingIdx: i,
            remove:      false,
          };
        }
      });
    },

    async saveRoleBindings() {
      /* eslint-disable no-console */

      const promises = [];

      for ( const row of this.rows ) {
        if ( row.remove ) {
          // Remove an existing entry

          if ( row.existing.subjects.length === 1 ) {
            // There's only one subject, remove the whole binding
            console.debug('Remove', row.existing.id, 'only one subject');
            promises.push(row.existing.remove());
          } else {
          // There's multiple subjects, remove just this one
            removeAt(row.existing.subjects, row.existingIdx);
            console.debug('Remove', row.existing.id, 'subject', row.existingIdx);
          }
        } else if ( row.existing ) {
          // Maybe update existing, which might be a PUT, or a PUT + POST, or a DELETE + POST
          // because the role of an existing binding can't be edited in k8s (because reasons, presumably).
          const obj = row.existing;
          const subj = obj.subjects[row.existingIdx];

          if ( obj.roleRef.name !== row.role || obj.roleRef.kind !== row.roleKind ) {
            // The role changed
            const neu = await this.createFrom(row);

            // Make a new binding
            promises.push(neu.save());
            console.debug('Create binding from', row.existing.id, 'because role changed');

            if ( obj.subjects.length === 1 ) {
              // There's only one subject, remove the whole binding
              promises.push(obj.remove());
              console.debug('Remove', row.existing.id, 'because role changed, only one subject');
            } else {
              // There's multiple subject, remove this one just this one
              removeAt(obj.subjects, row.existingIdx);
              promises.push(obj.save());
              console.debug('Update', row.existing.id, 'remove subject', row.existingIdx, 'because role changed');
            }
          } else if ( subj.name !== row.subject || subj.kind !== row.subjectKind ) {
            // This subject changed
            subj.kind = row.subjectKind;
            subj.name = row.subject;

            promises.push(obj.save());
            console.debug('Changed', row.existing.id, 'subject', row.existingIdx);
          } else {
            // Nothing changed
            console.debug('Unchanged', row.existing.id, 'subject', row.existingIdx);
          }
        } else {
          // Create new
          const obj = await this.createFrom(row);

          promises.push(obj.save());
          console.debug('Create binding');
        }
      }

      try {
        await Promise.all(promises);
      } catch (e) {
        // If something goes wrong, forget everything and reload to get the current state.
        this.readExistingBindings();
        throw e;
      }

      /* eslint-enable no-console */
    },

    createFrom(row) {
      let type, apiGroup;
      const inStore = this.inStore;

      if ( this.bindingScope === SCOPE_NAMESPACE ) {
        type = RBAC.ROLE_BINDING;
        apiGroup = 'rbac.authorization.k8s.io';
      } else if ( this.bindingScope === SCOPE_CLUSTER ) {
        type = RBAC.CLUSTER_ROLE_BINDING;
        apiGroup = 'rbac.authorization.k8s.io';
      // } else if ( this.bindingScope === SCOPE_GLOBAL ) {
      //   type = MANAGEMENT.GLOBAL_ROLE_BINDING;
      //   inStore = 'management'
      //   apiGroup = 'management.cattle.io' ?
      } else {
        throw new Error('Unknown binding scope');
      }

      const obj = this.$store.dispatch(`${ inStore }/create`, {
        type,
        metadata: {
          generateName: `ui-${ this.filterRoleValue ? `${ this.filterRoleValue }-` : '' }`,
          namespace:    this.namespace,
        },
        roleRef: {
          apiGroup,
          kind: row.roleKind,
          name: row.role,
        },
        subjects: [
          {
            apiGroup,
            kind: row.subjectKind,
            name: row.subject,
          },
        ]
      });

      return obj;
    },

    remove(row) {
      if ( row.existing ) {
        this.$set(row, 'remove', true);
      } else {
        removeObject(this.rows, row);
      }
    },

    add() {
      this.rows.push({
        subjectKind: 'User',
        subject:     '',
        roleKind:    this.roleScope,
        role:        '',
      });
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="showDetail">
    <SortableTable
      :rows="unremovedRows"
      :headers="detailHeaders"
      :table-actions="false"
      :row-actions="false"
      key-field="existing.id"
      default-sort-by="subject"
      :paged="true"
    />
  </div>
  <div v-else>
    <div
      v-for="(row, idx) in unremovedRows"
      :key="idx"
      class="role-row"
      :class="{[mode]: true}"
    >
      <div class="subject">
        <LabeledSelect
          v-model="row.subject"
          label-key="rbac.roleBinding.user.label"
          :mode="mode"
          :searchable="true"
          :taggable="true"
          :options="userOptions"
        />
      </div>
      <div class="binding">
        <LabeledSelect
          v-model="row.role"
          label-key="rbac.roleBinding.role.label"
          :mode="mode"
          :searchable="true"
          :taggable="true"
          :options="roleOptions"
        />
      </div>
      <div class="remove">
        <button
          v-t="'generic.remove'"
          :disabled="isView"
          type="button"
          class="btn role-link"
          @click="remove(row)"
        />
      </div>
    </div>
    <div>
      <button
        v-t="'rbac.roleBinding.add'"
        :disabled="isView"
        type="button"
        class="btn role-tertiary add"
        @click="add()"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.role-row{
  display: grid;
  grid-template-columns: 45% 45% 10%;

  grid-column-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;
  & .port{
    display: flex;
    justify-content: space-between;
  }

  &.show-host{
    grid-template-columns: 30% 16% 10% 15% 15% 5%;
  }

}

.add-host {
  justify-self: center;
}

.protocol {
  height: 100%;
}

.ports-headers {
  color: var(--input-label);
}

.toggle-host-ports {
  color: var(--primary);
}

.remove BUTTON {
  padding: 0px;
}
</style>
