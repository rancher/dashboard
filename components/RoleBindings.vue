<script>
import { RBAC as RBAC_ANNOTATIONS } from '@/config/labels-annotations';
import { allHash } from '@/utils/promise';
import { RBAC, MANAGEMENT } from '@/config/types';
import { _CONFIG, _DETAIL, _EDIT } from '@/config/query-params';
import { removeAt, removeObject } from '@/utils/array';
import Loading from '@/components/Loading';
import LabeledSelect from '@/components/form/LabeledSelect';

export const SCOPE_NAMESPACE = 'Role';
export const SCOPE_CLUSTER = 'ClusterRole';
// export const SCOPE_GLOBAL = 'GlobalRole';

export default {
  components: { Loading, LabeledSelect },

  props: {
    registerBeforeHook: {
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
      default: RBAC_ANNOTATIONS.PRODUCT
    },

    filterRoleValue: {
      type:    String,
      default: null,
    },
  },

  async fetch() {
    const hash = { users: this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER }) };

    if ( this.roleScope === SCOPE_NAMESPACE ) {
      hash.allRoles = this.$store.dispatch('cluster/findAll', { type: RBAC.ROLE });
    } else if ( this.roleScope === SCOPE_CLUSTER ) {
      hash.allRoles = this.$store.dispatch('cluster/findAll', { type: RBAC.CLUSTER_ROLE });
    // } else if ( this.roleScope === SCOPE_GLOBAL ) {
    // hash.allRoles = this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });
    } else {
      throw new Error('Unknown roleScope');
    }

    if ( this.bindingScope === SCOPE_NAMESPACE ) {
      hash.allBindings = this.$store.dispatch('cluster/findAll', { type: RBAC.ROLE_BINDING });
    } else if ( this.bindingScope === SCOPE_CLUSTER ) {
      hash.allBindings = this.$store.dispatch('cluster/findAll', { type: RBAC.CLUSTER_ROLE_BINDING });
    // } else if ( this.bindingScope === SCOPE_GLOBAL ) {
    // hash.allBindings = this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });
    } else {
      throw new Error('Unknown scope');
    }

    const out = await allHash(hash);

    for ( const key in out ) {
      this[key] = out[key];
    }

    if ( this.mode === _EDIT ) {
      this.readExistingBindings();
    } else {
      this.rows = [];
    }
  },

  data() {
    return {
      allRoles:    null,
      allBindings: null,
      users:       null,
      rows:        null,
    };
  },

  computed: {
    showDetail() {
      return this.as === _DETAIL;
    },

    userOptions() {
      return this.users.map((x) => {
        // displayName is a property actually on the user object, different the regular computed nameDisplay
        return { label: `${ x.displayName } (${ x.id })`, value: x.id };
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
        return role.metadata?.annotations?.[this.filterRoleKey] === this.filterRoleValue;
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
    this.registerBeforeHook(this.save, 'syncRoleBindings');
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
            subjectKind:      subject.kind,
            subject:          subject.name,
            roleKind:         binding.roleRef.kind,
            role:             binding.roleRef.name,
            existing:         binding,
            existingIdx:      i,
            remove:           false,
          };
        }
      });
    },

    // eslint-disable-block
    async save() {
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

            // And make a new binding
            promises.push(neu.save());
            console.debug('Create binding from', row.existing.id, 'because role changed');
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
      let type, apiGroup, inStore;

      if ( this.bindingScope === SCOPE_NAMESPACE ) {
        type = RBAC.ROLE_BINDING;
        inStore = 'cluster';
        apiGroup = 'rbac.authorization.k8s.io';
      } else if ( this.bindingScope === SCOPE_CLUSTER ) {
        type = RBAC.CLUSTER_ROLE_BINDING;
        inStore = 'cluster';
        apiGroup = 'rbac.authorization.k8s.io';
      // } else if ( this.bindingScope === SCOPE_GLOBAL ) {
      //   type = RBAC.GLOBAL_ROLE_BINDING;
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
        subjectKind:      'User',
        subject:          '',
        roleKind:         this.roleScope,
        role:             '',
      });
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="showDetail">
    Details...
  </div>
  <div v-else>
    <div v-for="(row, idx) in unremovedRows" :key="idx" class="role-row">
      <div class="subject">
        <LabeledSelect
          v-model="row.subject"
          label-key="rbac.roleBinding.user.label"
          :searchable="true"
          :taggable="true"
          :options="userOptions"
        />
      </div>
      <div class="binding">
        <LabeledSelect
          v-model="row.role"
          label-key="rbac.roleBinding.role.label"
          :searchable="true"
          :taggable="true"
          :options="roleOptions"
        />
      </div>
      <div class="remove">
        <button v-t="'generic.remove'" type="button" class="btn bg-transparent role-link" @click="remove(row)" />
      </div>
    </div>
    <div>
      <button v-t="'generic.add'" type="button" class="btn role-tertiary add" @click="add()" />
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
