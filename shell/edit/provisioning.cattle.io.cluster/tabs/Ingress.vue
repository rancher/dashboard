<script setup lang="ts">
import { _CREATE, _VIEW, _EDIT } from '@shell/config/query-params';
import { ref, computed, useTemplateRef } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { Banner } from '@components/Banner';
import IngressCards from '@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards.vue';
import {
  INGRESS_OPTIONS, INGRESS_DUAL, TRAEFIK, INGRESS_NGINX, INGRESS_NONE, INGRESS_MIGRATION_KB_LINK, INGRESS_CLASS_DEFAULT, INGRESS_CONTROLLER_CLASS_DEFAULT, INGRESS_CLASS_MIGRATION, INGRESS_CONTROLLER_CLASS_MIGRATION
} from '@shell/edit/provisioning.cattle.io.cluster/shared';
import IngressConfiguration from '@shell/edit/provisioning.cattle.io.cluster/ingress/IngressConfiguration.vue';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { set, get, mergeWithReplace } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';
import RichTranslation from '@shell/components/RichTranslation.vue';

interface Props {
  mode?: string;
  value: string | string[];
  nginxSupported: boolean;
  nginxChart: string;
  traefikChart: string;
  userChartValues: any;
  versionInfo: any;
}
const {
  mode = _CREATE,
  value,
  nginxChart,
  traefikChart,
  nginxSupported,
  userChartValues,
  versionInfo
} = defineProps<Props>();

const emit = defineEmits(['update:value', 'error', 'config-validation-changed', 'yaml-validation-changed', 'update-values']);
const store = useStore();
const { t } = useI18n(store);
const nginxYaml = useTemplateRef('nginx-yaml');
const traefikYaml = useTemplateRef('traefik-yaml');

const showAdvanced = ref<Boolean>(false);
const isView = computed(() => mode === _VIEW);
const isEdit = computed(() => mode === _EDIT);
const showTraefikBanner = ref<Boolean>(false);

const ingressSelection = computed(() => {
  if (Array.isArray(value) ) {
    return INGRESS_DUAL;
  } else if (!value || value.length === 0) {
    return INGRESS_NONE;
  } else {
    return value;
  }
});
const ingressOptions = computed(() => {
  return INGRESS_OPTIONS.filter((option) => !(option.id === INGRESS_DUAL && mode === _CREATE) &&
  !((option.id === INGRESS_NGINX || option.id === INGRESS_DUAL) && !nginxSupported)
  ).map((option) => {
    return {
      ...option,
      selected: option.id === ingressSelection.value
    };
  });
});

const ingressEnabled = computed({
  get() {
    return ingressSelection.value !== INGRESS_NONE;
  },
  set(val) {
    if (!val) {
      emit('update:value', INGRESS_NONE);
    } else {
      emit('update:value', TRAEFIK);
    }
  }
});

function initYamlEditor(chart: string) {
  const defaultChartValue = versionInfo[chart];

  return mergeWithReplace(defaultChartValue?.values, userChartValues[chart]);
}

function setCompatibilityModeValues(val: boolean) {
  set(traefikMerged.value, 'providers.kubernetesIngressNginx.enabled', val);
  if (!val) {
    set(traefikMerged.value, 'providers.kubernetesIngressNginx.ingressClass', INGRESS_CLASS_DEFAULT);
    set(traefikMerged.value, 'providers.kubernetesIngressNginx.controllerClass', INGRESS_CONTROLLER_CLASS_DEFAULT);
  } else {
    set(traefikMerged.value, 'providers.kubernetesIngressNginx.ingressClass', INGRESS_CLASS_MIGRATION);
    set(traefikMerged.value, 'providers.kubernetesIngressNginx.controllerClass', INGRESS_CONTROLLER_CLASS_MIGRATION);
  }
}

function preconfigureTraefik() {
  set(traefikMerged.value, 'ports.web.hostPort', 8000);
  set(traefikMerged.value, 'ports.websecure.hostPort', 8443);
  setCompatibilityModeValues(true);
  emit('update-values', traefikChart, traefikMerged.value);
}

const traefikMerged = ref(initYamlEditor(traefikChart));
const nginxMerged = ref(initYamlEditor(nginxChart));

const nginxHttp = computed({
  get() {
    return get(nginxMerged.value, 'controller.hostPort.ports.http');
  },
  set(val: string) {
    set(nginxMerged.value, 'controller.hostPort.ports.http', Number(val));
    emit('update-values', nginxChart, nginxMerged.value);
    updateYaml(nginxYaml.value, nginxMerged.value);
  }
});
const nginxHttps = computed({
  get() {
    return get(nginxMerged.value, 'controller.hostPort.ports.https');
  },
  set(val: string) {
    set(nginxMerged.value, 'controller.hostPort.ports.https', Number(val));
    emit('update-values', nginxChart, nginxMerged.value);
    updateYaml(nginxYaml.value, nginxMerged.value);
  }
});
const traefikHttp = computed({
  get() {
    return get(traefikMerged.value, 'ports.web.hostPort');
  },
  set(val: string) {
    set(traefikMerged.value, 'ports.web.hostPort', Number(val));
    emit('update-values', traefikChart, traefikMerged.value);
    updateYaml(traefikYaml.value, traefikMerged.value);
  }
});
const traefikHttps = computed({
  get() {
    return get(traefikMerged.value, 'ports.websecure.hostPort');
  },
  set(val: string) {
    set(traefikMerged.value, 'ports.websecure.hostPort', Number(val));
    emit('update-values', traefikChart, traefikMerged.value);
    updateYaml(traefikYaml.value, traefikMerged.value);
  }
});

const compatibilityMode = computed({
  get() {
    return get(traefikMerged.value, 'providers.kubernetesIngressNginx.enabled');
  },
  set(val: boolean) {
    setCompatibilityModeValues(val);
    emit('update-values', traefikChart, traefikMerged.value);
    updateYaml(traefikYaml.value, traefikMerged.value);
  }
});

function selectIngress(id: string) {
  if ( id === INGRESS_DUAL) {
    emit('update:value', [TRAEFIK, INGRESS_NGINX]);
    preconfigureTraefik();
  } else {
    emit('update:value', id);
    if (id === TRAEFIK && isEdit) {
      showTraefikBanner.value = true;
    }
  }
}

function updateYaml(component: any, value: any) {
  if (component) {
    component.updateValue(saferDump(value));
  }
}

</script>
<template>
  <h3 class="mb-10">
    {{ t('cluster.ingress.title') }}
  </h3>
  <Checkbox
    v-model:value="ingressEnabled"
    :mode="mode"
    :label="t('cluster.ingress.enableIngress')"
  />
  <div v-if="!ingressEnabled">
    <Banner
      color="warning"
      label-key="cluster.ingress.banners.disabled.label"
    />
  </div>
  <div v-else>
    <Banner
      color="info"
      label-key="cluster.ingress.banners.transitioning.label"
    />
    <IngressCards
      :options="ingressOptions"
      :mode="mode"
      @select="selectIngress"
    />
    <Banner
      v-if="(isEdit && ingressSelection !== TRAEFIK) || showTraefikBanner"
      color="warning"
    >
      <RichTranslation :k="`cluster.ingress.banners.selected.${ingressSelection}.label`">
        <template #docsUrl="{ content }">
          <a
            :href="`${INGRESS_MIGRATION_KB_LINK}`"
            tabindex="0"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {{ content }} <i class="icon icon-external-link" />
            <span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
          </a>
        </template>
      </RichTranslation>
    </Banner>
    <div class="mt-20">
      <IngressConfiguration
        v-model:compatibility-mode="compatibilityMode"
        v-model:nginxHttp="nginxHttp"
        v-model:nginxHttps="nginxHttps"
        v-model:traefikHttp="traefikHttp"
        v-model:traefikHttps="traefikHttps"
        :mode="mode"
        :ingress-selection="ingressSelection"
        @validation-changed="emit('config-validation-changed', $event)"
      />
    </div>
    <div>
      <button
        type="button"
        class="btn role-link advanced-toggle mb-0"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? t('cluster.ingress.hideAdvanced') : t('cluster.ingress.showAdvanced') }}
      </button>
    </div>
    <template v-if="showAdvanced">
      <div class="row">
        <div
          v-if="ingressSelection === TRAEFIK || ingressSelection === INGRESS_DUAL"
          :class="{ 'col': true, 'span-6': ingressSelection === INGRESS_DUAL, 'span-12': ingressSelection !== INGRESS_DUAL }"
        >
          <p
            v-if="ingressSelection === INGRESS_DUAL"
            class="mb-10"
          >
            {{ t('cluster.ingress.traefik.header') }}
          </p>
          <YamlEditor
            ref="traefik-yaml"
            class="ingress-yaml-editor"
            data-testid="traefik-yaml-editor"
            :value="traefikMerged"
            :mode="mode"
            :scrolling="true"
            :as-object="true"
            :editor-mode="isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE"
            :hide-preview-buttons="true"
            @update:value="emit('update-values', traefikChart, $event)"
            @validationChanged="emit('yaml-validation-changed', {name: traefikChart, val: $event})"
          />
        </div>
        <div
          v-if="ingressSelection === INGRESS_NGINX || ingressSelection === INGRESS_DUAL"
          :class="{ 'col': true, 'span-6': ingressSelection === INGRESS_DUAL, 'span-12': ingressSelection !== INGRESS_DUAL }"
        >
          <p
            v-if="ingressSelection === INGRESS_DUAL"
            class="mb-10"
          >
            {{ t('cluster.ingress.nginx.header') }}
          </p>
          <YamlEditor
            ref="nginx-yaml"
            class="ingress-yaml-editor"
            data-testid="ingress-nginx-yaml-editor"
            :value="nginxMerged"
            :mode="mode"
            :scrolling="true"
            :as-object="true"
            :editor-mode="isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE"
            :hide-preview-buttons="true"
            @update:value="emit('update-values', nginxChart, $event)"
            @validationChanged="emit('yaml-validation-changed', {name: nginxChart, val: $event})"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.advanced-toggle {
  padding: 0;
  gap: 0;
  min-height: 20px;

  &:focus-visible {
    border-color: var(--primary);
    @include focus-outline;
    outline-offset: -2px;
  }
}

.ingress-yaml-editor {
  :deep(.CodeMirror) {
    height: auto !important;
  }
  :deep(.CodeMirror-scroll) {
    max-height: 600px;
  }
}
</style>
