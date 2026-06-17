<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';

const AUTH_TYPES = [
  SECRET_TYPES.DOCKER_JSON,
  SECRET_TYPES.BASIC,
  SECRET_TYPES.SSH,
  SECRET_TYPES.RKE_AUTH_CONFIG
];

const props = defineProps<{
  settingValue: Record<string, any>;
  defaultValue?: Record<string, any>;
  rules?: Array<(value: any) => string | undefined>;
}>();

const emit = defineEmits(['update:settingValue']);

const store = useStore();
const settingValue = toRef(props, 'settingValue');
const defaultValue = toRef(props, 'defaultValue');
const secrets = ref<any[]>([]);

const secretOptions = computed(() => secrets.value
  .filter((s) => AUTH_TYPES.includes(s._type))
  .map((s) => {
    const { dataPreview, subTypeDisplay, metadata } = s;

    const label = subTypeDisplay && dataPreview ? `${ metadata.name } (${ subTypeDisplay }: ${ dataPreview })` : `${ metadata.name } (${ subTypeDisplay })`;

    return {
      label,
      value: s.metadata?.name
    };
  })
);

const selectedSecrets = computed({
  get: () => {
    const sValue = settingValue.value || defaultValue.value || '';

    return sValue.split(',').reduce((all: string[], secret: string) => {
      if (!!secret.trim()) {
        all.push(secret.trim());
      }

      return all;
    }, []);
  },
  set: (neu: string[]) => {
    const newSettingValue = neu?.length ? neu.join(',') : null;

    emit('update:settingValue', newSettingValue);
  },
});

onMounted(async() => {
  const res = await store.dispatch('management/findAll', {
    type: SECRET,
    opt:  { namespaced: 'cattle-system' },
  });

  secrets.value = Array.isArray(res) ? res : [];
});

</script>

<template>
  <LabeledSelect
    id="pull-secrets"
    v-model:value="selectedSecrets"
    label="Image Pull Secrets"
    :options="secretOptions"
    :rules="rules"
    :multiple="true"
  />
</template>

<style lang="scss" scoped>
//  :deep(.vs__selected) {
//     width: auto !important;
//   }
</style>
