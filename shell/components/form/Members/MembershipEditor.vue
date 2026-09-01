<script>
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import ArrayList from '@shell/components/form/ArrayList';
import Principal from '@shell/components/auth/Principal';
import Loading from '@shell/components/Loading';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { get, set } from '@shell/utils/object';
import { fetchProjectMembershipPermissions } from '@shell/utils/project-permissions';

function normalizeId(id) {
  return id?.replace(':', '/') || id;
}

export function canViewMembershipEditor(store, needsProject = false) {
  return (!!store.getters['management/schemaFor'](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING) || !needsProject) &&
    !!store.getters['management/schemaFor'](MANAGEMENT.ROLE_TEMPLATE) &&
    !!store.getters['rancher/schemaFor'](NORMAN.PRINCIPAL);
}

// Can the user VIEW the membership list (read-only)? Unlike `canViewMembershipEditor` (which gates
// add/remove and needs the role-template + principal reads), viewing needs only the binding schema.
export function canViewMembershipEditorList(store, needsProject = false) {
  const bindingType = needsProject ? NORMAN.PROJECT_ROLE_TEMPLATE_BINDING : NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING;

  return !!store.getters['rancher/schemaFor'](bindingType);
}

export default {
  emits: ['membership-update'],

  components: {
    ArrayList, Loading, Principal
  },

  props: {
    addMemberDialogName: {
      type:     String,
      required: true
    },

    parentKey: {
      type:     String,
      required: true
    },

    parentId: {
      type:    String,
      default: null
    },

    mode: {
      type:     String,
      required: true
    },

    type: {
      type:     String,
      required: true
    },

    defaultBindingHandler: {
      type:    Function,
      default: null,
    },

    modalSticky: {
      type:    Boolean,
      default: false,
    }
  },

  setup() {
    const bindingKeys = new Map();
    let nextBindingKey = 0;

    const getBindingKey = (binding) => {
      if (!bindingKeys.has(binding)) {
        bindingKeys.set(binding, nextBindingKey++);
      }

      return bindingKeys.get(binding);
    };

    return { getBindingKey };
  },

  async fetch() {
    const roleBindingRequestParams = { type: this.type, opt: { force: true } };

    if (this.type === NORMAN.PROJECT_ROLE_TEMPLATE_BINDING && this.parentId) {
      Object.assign(roleBindingRequestParams, { opt: { filter: { projectId: this.parentId.split('/').join(':') }, force: true } });
    }
    // Guard each hydration dispatch on its schema so a view-only user doesn't hit "Unknown schema";
    // only the bindings (index 0) are consumed below, the rest hydrate name/role resolution.
    const userHydration = [
      this.schema ? this.$store.dispatch(`rancher/findAll`, roleBindingRequestParams) : []
    ];

    if (this.$store.getters['rancher/schemaFor'](NORMAN.PRINCIPAL)) {
      userHydration.push(this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }));
    }

    if (this.$store.getters['management/schemaFor'](MANAGEMENT.ROLE_TEMPLATE)) {
      userHydration.push(this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }));
    }

    if (this.$store.getters['management/schemaFor'](MANAGEMENT.USER)) {
      userHydration.push(this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }));
    }

    const [allBindings] = await Promise.all(userHydration);

    const bindings = allBindings
      .filter((b) => normalizeId(get(b, this.parentKey)) === normalizeId(this.parentId));

    this['lastSavedBindings'] = [...bindings];

    // Add the current user as the project owner. This will get created by default
    if (this.mode === _CREATE && bindings.length === 0 && this.defaultBindingHandler) {
      const defaultBinding = await this.defaultBindingHandler();

      defaultBinding.isDefaultBinding = true;
      bindings.push(defaultBinding);
    }

    this['bindings'] = bindings;

    // Schema methods are global, so read the per-project answer from the project's
    // `resourcePermissions` to only offer "Add" where the user can create a binding in THIS project.
    if (this.type === NORMAN.PROJECT_ROLE_TEMPLATE_BINDING && this.parentId && this.mode !== _CREATE) {
      const permissions = await fetchProjectMembershipPermissions(this.$store, this.parentId);
      const permission = permissions[normalizeId(this.parentId)];

      this['canAddMember'] = !!permission?.create;
      this['canRemoveMember'] = !!permission?.remove;
    }
  },

  data() {
    return {
      schema:            this.$store.getters[`rancher/schemaFor`](this.type),
      bindings:          [],
      lastSavedBindings: [],
      canAddMember:      true,
      canRemoveMember:   true,
    };
  },

  computed: {
    newBindings() {
      return this.bindings
        .filter((binding) => !binding.id && !this.lastSavedBindings.includes(binding) && !binding.isDefaultBinding);
    },
    removedBindings() {
      return this.lastSavedBindings
        .filter((binding) => !this.bindings.includes(binding));
    },
    membershipUpdate() {
      const newBindings = this.newBindings;
      const removedBindings = this.removedBindings;

      return {
        newBindings:     this.newBindings,
        removedBindings: this.removedBindings,
        save:            (parentId) => {
          const savedPromises = newBindings.map((binding) => {
            set(binding, this.parentKey, parentId);

            return binding.save();
          });

          const removedPromises = removedBindings.map((binding) => binding.remove());

          return Promise.all([...savedPromises, ...removedPromises]);
        }
      };
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    isView() {
      return this.mode === _VIEW;
    },

    // Can add/remove members here? The add flow needs the role-template + principal reads,
    // so when those are absent the editor is shown read-only.
    canManageMembers() {
      return canViewMembershipEditor(this.$store, this.type === NORMAN.PROJECT_ROLE_TEMPLATE_BINDING);
    },
  },
  watch: {
    membershipUpdate: {
      deep: true,
      handler() {
        this.$emit('membership-update', this.membershipUpdate);
      }
    }
  },

  methods: {
    addMember() {
      this.$store.dispatch('cluster/promptModal', {
        component:      this.addMemberDialogName,
        componentProps: { onAdd: this.onAddMember },
        modalSticky:    this.modalSticky
      });
    },

    onAddMember(bindings) {
      this['bindings'] = [...this.bindings, ...bindings];
    },
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <ArrayList
    v-else
    v-model:value="bindings"
    :mode="mode"
    :show-header="true"
    :add-allowed="canAddMember && canManageMembers"
  >
    <template #column-headers>
      <div class="box mb-0">
        <div class="column-headers row">
          <div class="col span-6">
            <label class="text-label">{{ t('membershipEditor.user') }}</label>
          </div>
          <div class="col span-6">
            <label class="text-label">{{ t('membershipEditor.role') }}</label>
          </div>
        </div>
      </div>
    </template>
    <template #columns="{row, i}">
      <div class="columns row">
        <div class="col span-6">
          <Principal
            :key="getBindingKey(row.value)"
            :value="row.value.principalId"
          />
        </div>
        <div
          :data-testid="`role-item-${i}`"
          class="col span-6 role"
        >
          {{ row.value.roleDisplay }}
        </div>
      </div>
    </template>
    <template #add>
      <button
        type="button"
        class="btn role-primary mt-10"
        data-testid="add-item"
        @click="addMember"
      >
        {{ t('generic.add') }}
      </button>
    </template>
    <template #remove-button="{remove, i}">
      <!-- Hide Remove on an EXISTING binding (a saved row has an id) when the user lacks
           delete permission; newly-added, unsaved rows stay removable. -->
      <span v-if="(isCreate && i === 0) || isView || !canManageMembers || (!canRemoveMember && !!bindings[i]?.id)" />
      <button
        v-else
        type="button"
        :disabled="isView"
        class="btn role-link"
        :data-testid="`remove-item-${i}`"
        @click="remove"
      >
        {{ t('generic.remove') }}
      </button>
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
.role {
  display: flex;
  align-items: center;
  flex-direction: row;
}
</style>
