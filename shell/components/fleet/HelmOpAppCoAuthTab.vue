<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import AsyncButton from '@shell/components/AsyncButton';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { AUTH_TYPE, FLEET, FLEET_APPCO_AUTH_GENERATE_NAME } from '@shell/config/types';
import { CATALOG, FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';

const props = defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  tempCachedValues: {
    type:     Object,
    required: true
  },
  createErrors: {
    type:    Array,
    default: () => []
  },
  onCreateAuth: {
    type:     Function,
    required: true
  },
  registerBeforeHook: {
    type:     Function,
    required: true
  },
});

const emit = defineEmits(['update:cached-auth', 'update:auth']);

const store = useStore();
const { t } = useI18n(store);

// Track whether credentials have been entered but not yet saved
const pendingCredentials = ref(null);
const createButtonCallback = ref(null);

const hasCredentials = computed(() => {
  const creds = pendingCredentials.value;

  return !!(creds?.publicKey && creds?.privateKey);
});

// The currently selected secret name (stripped of namespace prefix)
const selectedSecretName = computed(() => {
  const raw = props.value.spec?.helmSecretName || '';

  return raw.includes('/') ? raw.split('/')[1] : raw;
});

// Check if the selected secret is currently the workspace default
const workspaceObj = computed(() => {
  const allWorkspaces = store.getters[`${ CATALOG._MANAGEMENT }/all`](FLEET.WORKSPACE) || [];
  const ns = props.value.metadata?.namespace;

  return allWorkspaces.find((ws) => ws.id === ns);
});

const currentDefault = computed(() => {
  return workspaceObj.value?.metadata?.annotations?.[FLEET_ANNOTATIONS.APPCO_DEFAULT_AUTH] || '';
});

// true when the select shows an existing secret (not creating new creds)
const isExistingSecretSelected = computed(() => {
  return !!selectedSecretName.value && !Object.values(AUTH_TYPE).includes(selectedSecretName.value);
});

const isAlreadyDefault = computed(() => {
  return !!(selectedSecretName.value && selectedSecretName.value === currentDefault.value);
});

const updateCachedAuthVal = async(value, key) => {
  // Track locally for the Create button; also bubble up to parent for cache
  pendingCredentials.value = value;
  emit('update:cached-auth', { value, key });
};

const updateAuth = (value, key) => {
  emit('update:auth', { value, key });
};

const saveSecret = async(buttonCb) => {
  createButtonCallback.value = buttonCb;
  try {
    await props.onCreateAuth(pendingCredentials.value);
    buttonCb(true);
  } catch (e) {
    buttonCb(false);
  }
};

const saveAsDefault = async(buttonCb) => {
  try {
    const ws = workspaceObj.value;

    if (!ws) {
      buttonCb(false);

      return;
    }

    if (!ws.metadata.annotations) {
      ws.metadata.annotations = {};
    }

    ws.metadata.annotations[FLEET_ANNOTATIONS.APPCO_DEFAULT_AUTH] = selectedSecretName.value;

    await ws.save();
    buttonCb(true);
  } catch (e) {
    buttonCb(false);
  }
};
</script>

<template>
  <div>
    <Banner
      color="info"
      label-key="fleet.helmOp.add.steps.auth.info"
    />

    <h2>{{ t('fleet.helmOp.auth.appco') }}</h2>

    <div>
      <SelectOrCreateAuthSecret
        :value="value.spec.helmSecretName"
        :namespace="value.metadata.namespace"
        :limit-to-namespace="true"
        :delegate-create-to-parent="true"
        :register-before-hook="registerBeforeHook"
        in-store="management"
        :mode="mode"
        :generate-name="FLEET_APPCO_AUTH_GENERATE_NAME"
        label-key="fleet.helmOp.auth.appco"
        :fixed-http-basic-auth="true"
        :filter-basic-auth="FLEET_APPCO_AUTH_GENERATE_NAME"
        :allow-none="false"
        :pre-select="tempCachedValues.helmSecretName || { selected: AUTH_TYPE._BASIC }"
        :cache-secrets="true"
        @update:value="updateAuth($event, 'helmSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
      />
    </div>

    <div
      v-if="!isExistingSecretSelected"
      class="mt-10"
    >
      <Banner
        v-for="(err, i) in createErrors"
        :key="i"
        color="error"
        :label="err"
      />
      <AsyncButton
        :disabled="!hasCredentials"
        mode="createAppCoAuth"
        @click="saveSecret"
      />
    </div>

    <div class="mt-10">
      <span
        v-if="isExistingSecretSelected"
        v-clean-tooltip="isAlreadyDefault ? t('fleet.helmOp.auth.alreadyDefault') : null"
        class="set-default-wrapper"
      >
        <AsyncButton
          :class="{ 'no-pointer': isAlreadyDefault }"
          mode="setAppCoDefault"
          :disabled="isAlreadyDefault"
          @click="saveAsDefault"
        />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.set-default-wrapper {
  display: inline-block;
}

.no-pointer {
  pointer-events: none;
}
</style>
