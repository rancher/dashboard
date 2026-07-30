<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import { sortBy } from '@shell/utils/sort';
import { NAMESPACE } from '@shell/config/types';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import LabeledSelectWithCreate from '@shell/components/form/LabeledSelectWithCreate';
import { useI18n } from '@shell/composables/useI18n';

/**
 * A self-contained namespace selector that:
 *  - Reads namespaces from the Vuex store (or accepts overrides)
 *  - Prepends a "Create new namespace" option when the user has permission
 *  - Delegates the create/select UI to LabeledSelectWithCreate
 *  - Emits `update:value` (the namespace string) and `isNamespaceNew`
 */
defineOptions({ name: 'NamespaceSelect' });

const props = defineProps({
  value: {
    type:    String,
    default: null,
  },
  mode: {
    type:    String,
    default: _CREATE,
  },
  label: {
    type:    String,
    default: null,
  },
  /** takes precedence over label if set */
  labelKey: {
    type:    String,
    default: 'nameNsDescription.namespace.label',
  },
  placeholder: {
    type:    String,
    default: 'namespace.selectOrCreate',
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
  forceNamespace: {
    type:    String,
    default: null,
  },
  noDefaultNamespace: {
    type:    Boolean,
    default: false,
  },
  override: {
    type:    Array,
    default: null,
  },
  options: {
    type:    Array,
    default: null,
  },
  mapper: {
    type:    Function,
    default: null,
  },
  createNamespaceOverride: {
    type:    Boolean,
    default: false,
  },
  rules: {
    type:    Array,
    default: () => [],
  },
  fieldName: {
    type:    String,
    default: null,
  },
  appendToBody: {
    type:    Boolean,
    default: false,
  },
  requireDirty: {
    type:    Boolean,
    default: true,
  },
  required: {
    type:    Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value', 'isNamespaceNew']);

const store = useStore();
const { t } = useI18n(store);

const isCreate = computed(() => props.mode === _CREATE);

const allowedNamespaces = computed(() => store.getters.allowedNamespaces());
const storeNamespaces = computed(() => store.getters.namespaces());
const currentCluster = computed(() => store.getters.currentCluster);
const inStore = computed(() => store.getters['currentStore']());
const nsSchema = computed(() => store.getters[`${ inStore.value }/schemaFor`](NAMESPACE));

const canCreateNamespace = computed(() => {
  return (nsSchema.value?.collectionMethods || []).includes('POST') && currentCluster.value?.canUpdate;
});

const namespace = ref(
  props.forceNamespace ??
    props.value ??
    (!props.noDefaultNamespace ? store.getters['defaultNamespace'] : null)
);

const realNamespaceOptions = computed(() => {
  let namespaces;

  if (props.override) {
    namespaces = props.override;
  } else if (props.options) {
    namespaces = props.options.map((ns) => (typeof ns === 'string' ? ns : (ns.name || ns.id))).filter(Boolean).sort();
  } else {
    const namespaceObjs = isCreate.value ? allowedNamespaces.value : storeNamespaces.value;

    namespaces = Object.keys(namespaceObjs);
  }

  const normalized = namespaces
    .map((ns) => {
      if (typeof ns === 'string') {
        return { nameDisplay: ns, id: ns };
      }

      const id = ns?.id || ns?.name;
      const nameDisplay = ns?.nameDisplay || ns?.name || id;

      return {
        ...ns,
        nameDisplay,
        id,
      };
    })
    .filter((ns) => !!ns.id);

  const mapped = normalized
    .map(props.mapper || ((obj) => ({
      label: obj.nameDisplay,
      value: obj.id,
    })));

  const sorted = sortBy(mapped, 'label');

  if (props.forceNamespace) {
    sorted.unshift({ label: props.forceNamespace, value: props.forceNamespace });
  }

  return sorted;
});

const namespaceSelectOptions = computed(() => {
  const sorted = [...realNamespaceOptions.value];

  // A namespace the user just created via the "create new" flow doesn't
  // exist in the store's namespace list yet - it isn't actually created
  // until save. Without a matching option, the underlying select has
  // nothing to display for the current value and falls back to blank.
  if (namespace.value && !sorted.some((o) => o.value === namespace.value)) {
    sorted.unshift({ label: namespace.value, value: namespace.value });
  }

  return sorted;
});

const lastIsNamespaceNew = ref(null);

// Keep in sync when the parent changes value externally
watch(() => props.value, (val) => {
  if (val !== namespace.value) namespace.value = val;
});

const isNew = (val) => !val || !realNamespaceOptions.value.find((o) => o.value === val);

function emitNamespaceNewIfChanged(nextIsNew) {
  if (lastIsNamespaceNew.value !== nextIsNew) {
    lastIsNamespaceNew.value = nextIsNew;
    emit('isNamespaceNew', nextIsNew);
  }
}

function emitChange(val) {
  namespace.value = val;
  emit('update:value', val);
  emitNamespaceNewIfChanged(isNew(val));
}

function dispatchCreateNamespace(creating) {
  store.dispatch('cru-resource/setCreateNamespace', creating);
}
const isCreatingNamespace = ref(false);

function onUpdate(val) {
  if (!isCreatingNamespace.value) {
    dispatchCreateNamespace(false);
  }
  emitChange(val);
}

function onCreating() {
  isCreatingNamespace.value = true;
  dispatchCreateNamespace(true);
  emitNamespaceNewIfChanged(true);
}

function onCancel() {
  isCreatingNamespace.value = false;
  dispatchCreateNamespace(false);
  const defaultNs = store.getters['defaultNamespace'] || realNamespaceOptions.value.find((o) => !!o.value)?.value;

  emitChange(defaultNs);
}

const isReallyDisabled = computed(() => !!props.forceNamespace || props.disabled || props.mode === _EDIT);
</script>

<template>
  <LabeledSelectWithCreate
    v-if="!forceNamespace"
    :value="namespace"
    :name="fieldName"
    :clearable="true"
    :options="namespaceSelectOptions"
    :disabled="isReallyDisabled"
    :mode="mode"
    :label="label"
    :label-key="labelKey"
    :placeholder="t(placeholder)"
    :create-label="t('namespace.createNamespace')"
    :create-placeholder="t('namespace.createNamespace')"
    :create-allowed="canCreateNamespace || createNamespaceOverride"
    :rules="rules"
    :append-to-body="appendToBody"
    :require-dirty="requireDirty"
    :required="required"
    @update:value="onUpdate"
    @creating="onCreating"
    @cancel="onCancel"
  />
</template>
