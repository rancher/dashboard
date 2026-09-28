<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import { sortBy } from '@shell/utils/sort';
import { NAMESPACE } from '@shell/config/types';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import LabeledSelectWithCreate from '@shell/components/form/LabeledSelectWithCreate.vue';
import { useI18n } from '@shell/composables/useI18n';
import type { SelectOption } from '@shell/types/components/labeledSelect';
import type { Validator } from '@shell/utils/validators/formRules/index';

/**
 * A self-contained namespace selector that:
 *  - Reads namespaces from the Vuex store (or accepts overrides)
 *  - Prepends a "Create new namespace" option when the user has permission
 *  - Delegates the create/select UI to LabeledSelectWithCreate
 *  - Emits `update:value` (the namespace string) and `isNamespaceNew`
 */
defineOptions({ name: 'NamespaceSelect' });

interface RawNamespace {
  id?: string;
  name?: string;
  nameDisplay?: string;
  [key: string]: any;
}

interface NormalizedNamespace extends RawNamespace {
  id: string;
  nameDisplay: string;
}

type Mapper = (ns: NormalizedNamespace) => SelectOption;

interface Props {
  value?: string | null;
  mode?: string;
  label?: string;
  /** takes precedence over label if set */
  labelKey?: string | null;
  placeholder?: string;
  createPlaceholder?: string;
  disabled?: boolean;
  forceNamespace?: string | null;
  noDefaultNamespace?: boolean;
  override?: (string | RawNamespace)[] | null;
  options?: (string | RawNamespace)[] | null;
  mapper?: Mapper | null;
  createNamespaceOverride?: boolean;
  rules?: Validator[];
  name?: string;
  appendToBody?: boolean;
  requireDirty?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value:                   null,
  mode:                    _CREATE,
  label:                   undefined,
  labelKey:                'nameNsDescription.namespace.label',
  placeholder:             'namespace.selectOrCreate',
  createPlaceholder:       'namespace.createNamespace',
  disabled:                false,
  forceNamespace:          null,
  noDefaultNamespace:      false,
  override:                null,
  options:                 null,
  mapper:                  null,
  createNamespaceOverride: false,
  rules:                   () => [],
  name:                    undefined,
  appendToBody:            false,
  requireDirty:            true,
  required:                false,
});

const emit = defineEmits<{(e: 'update:value', value: string): void, (e: 'isNamespaceNew', value: boolean): void}>();

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

const namespace = ref<string | null>(
  props.forceNamespace ??
    props.value ??
    (!props.noDefaultNamespace ? store.getters['defaultNamespace'] : null)
);

const realNamespaceOptions = computed<SelectOption[]>(() => {
  let namespaces: (string | RawNamespace)[];

  if (props.override) {
    namespaces = props.override;
  } else if (props.options) {
    namespaces = props.options.map((ns) => (typeof ns === 'string' ? ns : (ns.name || ns.id))).filter(Boolean).sort() as string[];
  } else {
    const namespaceObjs = isCreate.value ? allowedNamespaces.value : storeNamespaces.value;

    namespaces = Object.keys(namespaceObjs);
  }

  const normalized: NormalizedNamespace[] = namespaces
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
    .filter((ns): ns is NormalizedNamespace => !!ns.id);

  const mapped = normalized
    .map(props.mapper || ((obj: NormalizedNamespace) => ({
      label: obj.nameDisplay,
      value: obj.id,
    })));

  const sorted = sortBy(mapped, 'label');

  if (props.forceNamespace) {
    sorted.unshift({ label: props.forceNamespace, value: props.forceNamespace });
  }

  return sorted;
});

const namespaceSelectOptions = computed<SelectOption[]>(() => {
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

const lastIsNamespaceNew = ref<boolean | null>(null);

// Keep in sync when the parent changes value externally
watch(() => props.value, (val) => {
  if (val !== namespace.value) namespace.value = val ?? null;
});

const isNew = (val: string) => !val || !realNamespaceOptions.value.find((o) => o.value === val);

function emitNamespaceNewIfChanged(nextIsNew: boolean) {
  if (lastIsNamespaceNew.value !== nextIsNew) {
    lastIsNamespaceNew.value = nextIsNew;
    emit('isNamespaceNew', nextIsNew);
  }
}

function emitChange(val: string) {
  namespace.value = val;
  emit('update:value', val);
  emitNamespaceNewIfChanged(isNew(val));
}

function dispatchCreateNamespace(creating: boolean) {
  store.dispatch('cru-resource/setCreateNamespace', creating);
}
const isCreatingNamespace = ref(false);

function onUpdate(val: string) {
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
    :value="namespace"
    :name="name"
    :clearable="true"
    :options="namespaceSelectOptions"
    :disabled="isReallyDisabled"
    :mode="mode"
    :label="label"
    :label-key="labelKey"
    :placeholder="t(placeholder)"
    :create-label="t('namespace.createNamespace')"
    :create-placeholder="t(createPlaceholder)"
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
