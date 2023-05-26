<script>
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import ArrayList from '@shell/components/form/ArrayList';
import Loading from '@shell/components/Loading';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { get, set } from '@shell/utils/object';

function normalizeId(id) {
  return id?.replace(':', '/') || id;
}

export function canViewMembershipEditor(store, needsProject = false) {
  return (!!store.getters['management/schemaFor'](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING) || !needsProject) &&
    !!store.getters['management/schemaFor'](MANAGEMENT.ROLE_TEMPLATE) &&
    !!store.getters['rancher/schemaFor'](NORMAN.PRINCIPAL);
}

export default {
  components: { ArrayList, Loading },

  props: {
    addMemberDialogName: {
      type:     String,
      required: true
    },

    editMemberDialogName: {
      type:     String,
      default:  '',
      required: false
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

  async fetch() {
    const userHydration = [
      this.schema ? this.$store.dispatch(`rancher/findAll`, { type: this.type, opt: { force: true } }) : [],
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER })
    ];
    const [allBindings] = await Promise.all(userHydration);

    const bindings = allBindings
      .filter(b => normalizeId(get(b, this.parentKey)) === normalizeId(this.parentId));

    this.$set(this, 'lastSavedBindings', [...bindings]);

    // Add the current user as the project owner. This will get created by default
    if (this.mode === _CREATE && bindings.length === 0 && this.defaultBindingHandler) {
      const defaultBinding = await this.defaultBindingHandler();

      defaultBinding.isDefaultBinding = true;
      bindings.push(defaultBinding);
    }

    this.$set(this, 'bindings', bindings);
  },

  data() {
    return {
      schema:            this.$store.getters[`rancher/schemaFor`](this.type),
      bindings:          [],
      lastSavedBindings: [],
    };
  },

  computed: {
    newBindings() {
      return this.bindings
        .filter(binding => !binding.id && !this.lastSavedBindings.includes(binding) && !binding.isDefaultBinding);
    },
    removedBindings() {
      return this.lastSavedBindings
        .filter(binding => !this.bindings.includes(binding));
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

          const removedPromises = removedBindings.map(binding => binding.remove());

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
      this.$set(this, 'bindings', [...this.bindings, ...bindings]);
    },

    editMember(binding, remove) {
      this.$store.dispatch('cluster/promptModal', {
        component:      this.editMemberDialogName,
        componentProps: { onAdd: p => this.onUpdate(p, remove), value: binding.value },
        modalSticky:    this.modalSticky
      });
    },

    onUpdate({ toSaved, toRemoved }, remove) {
      if (toRemoved.length > 0) {
        remove();
        this.$refs.bindingsRef.update();
      }

      this.$nextTick(() => {
        this.$set(this, 'bindings', [...this.bindings, ...toSaved]);
      });
    }
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <ArrayList
    v-else
    ref="bindingsRef"
    v-model="bindings"
    :mode="mode"
    :show-header="true"
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
    <template #columns="{row}">
      <div class="columns row">
        <div class="col span-6">
          <Principal
            :key="row.value.principalId"
            :value="row.value.principalId"
          />
        </div>
        <div class="col span-6 role">
          {{ row.value.roleDisplay }}
        </div>
      </div>
    </template>
    <template #add>
      <button
        type="button"
        class="btn role-primary mt-10"
        @click="addMember"
      >
        {{ t('generic.add') }}
      </button>
    </template>
    <template #remove-button="{remove, i, row}">
      <span v-if="(isCreate && i === 0) || isView" />
      <div
        v-else
        class="role"
      >
        <button
          type="button"
          :disabled="isView"
          class="btn btn-sm role-link"
          @click="remove"
        >
          <i class="icon icon-trash" />
        </button>
        <button
          v-if="editMemberDialogName && row.value.projectId"
          type="button"
          :disabled="isView"
          class="btn btn-sm role-link"
          @click="editMember(row, remove)"
        >
          <i class="icon icon-edit" />
        </button>
      </div>
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
.role {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 10px;
}
</style>
