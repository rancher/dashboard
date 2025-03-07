<script>
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import ArrayList from '@shell/components/form/ArrayList';
import Principal from '@shell/components/auth/Principal';
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

  async fetch() {
    const roleBindingRequestParams = { type: this.type, opt: { force: true } };

    if (this.type === NORMAN.PROJECT_ROLE_TEMPLATE_BINDING && this.parentId) {
      Object.assign(roleBindingRequestParams, { opt: { filter: { projectId: this.parentId.split('/').join(':') }, force: true } });
    }
    const userHydration = [
      this.schema ? this.$store.dispatch(`rancher/findAll`, roleBindingRequestParams) : [],
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER })
    ];
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
      <span v-if="(isCreate && i === 0) || isView" />
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
