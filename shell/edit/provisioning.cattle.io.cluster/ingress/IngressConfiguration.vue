<script setup lang="ts">
import { computed, watch } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { INGRESS_DUAL, TRAEFIK, INGRESS_NGINX } from '@shell/edit/provisioning.cattle.io.cluster/shared';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import formRulesGenerator from '@shell/utils/validators/formRules';

interface Props {
  mode?: string;
  ingressSelection: string;
}
const {
  mode = _CREATE,
  ingressSelection,
} = defineProps<Props>();
const store = useStore();
const { t } = useI18n(store);

const emit = defineEmits(['validation-changed']);

const compatibilityMode = defineModel<boolean>('compatibilityMode');
const nginxHttp = defineModel<number>('nginxHttp');
const nginxHttps = defineModel<number>('nginxHttps');
const traefikHttp = defineModel<number>('traefikHttp');
const traefikHttps = defineModel<number>('traefikHttps');

const nginxHttpRules = computed(() => {
  const { portNumber, isInteger } = formRulesGenerator(t, { key: t('cluster.ingress.configurationOptions.nginx.http') });
  const portRules = [(val: any) => !val ? undefined : isInteger(val), portNumber];

  return [...portRules,
    (val: any) => {
      if (ingressSelection === INGRESS_DUAL && String(val) === String(traefikHttp.value)) {
        return t('cluster.ingress.validation.portsMatch');
      }

      return undefined;
    }
  ];
});

const nginxHttpsRules = computed(() => {
  const { portNumber, isInteger } = formRulesGenerator(t, { key: t('cluster.ingress.configurationOptions.nginx.https') });
  const portRules = [(val: any) => !val ? undefined : isInteger(val), portNumber];

  return [...portRules,
    (val: any) => {
      if (ingressSelection === INGRESS_DUAL && String(val) === String(traefikHttps.value)) {
        return t('cluster.ingress.validation.portsMatch');
      }

      return undefined;
    }
  ];
});

const traefikHttpRules = computed(() => {
  const { portNumber, isInteger } = formRulesGenerator(t, { key: t('cluster.ingress.configurationOptions.traefik.http') });
  const portRules = [(val: any) => !val ? undefined : isInteger(val), portNumber];

  return [...portRules, (val: any) => {
    if (ingressSelection === INGRESS_DUAL && String(val) === String(nginxHttp.value)) {
      return t('cluster.ingress.validation.portsMatch');
    }

    return undefined;
  }
  ];
});

const traefikHttpsRules = computed(() => {
  const { portNumber, isInteger } = formRulesGenerator(t, { key: t('cluster.ingress.configurationOptions.traefik.https') });
  const portRules = [(val: any) => !val ? undefined : isInteger(val), portNumber];

  return [...portRules, (val: any) => {
    if (ingressSelection === INGRESS_DUAL && String(val) === String(nginxHttps.value)) {
      return t('cluster.ingress.validation.portsMatch');
    }

    return undefined;
  }
  ];
});

const isValid = computed(() => {
  const check = (val: any, rules: any[]) => rules.every((rule) => rule(val) === undefined);

  if (ingressSelection === INGRESS_DUAL) {
    return check(nginxHttp.value, nginxHttpRules.value) && check(nginxHttps.value, nginxHttpsRules.value) &&
      check(traefikHttp.value, traefikHttpRules.value) && check(traefikHttps.value, traefikHttpsRules.value);
  }
  if (ingressSelection === TRAEFIK) {
    return check(traefikHttp.value, traefikHttpRules.value) && check(traefikHttps.value, traefikHttpsRules.value);
  }
  if (ingressSelection === INGRESS_NGINX) {
    return check(nginxHttp.value, nginxHttpRules.value) && check(nginxHttps.value, nginxHttpsRules.value);
  }

  return true;
});

watch(isValid, (val) => emit('validation-changed', val), { immediate: true });
</script>
<template>
  <h4>{{ t('cluster.ingress.configurationOptions.title') }}</h4>
  <Checkbox
    v-if="ingressSelection === INGRESS_DUAL"
    v-model:value="compatibilityMode"
    label-key="cluster.ingress.configurationOptions.compatibilityMode"
    class="mb-10"
  />
  <div
    v-if="ingressSelection === TRAEFIK || ingressSelection === INGRESS_DUAL"
    class="row"
    :class="ingressSelection === INGRESS_DUAL ? 'mb-10' : ''"
  >
    <div class="span-2 mr-20">
      <LabeledInput
        v-model:value="traefikHttp"
        label-key="cluster.ingress.configurationOptions.traefik.http"
        :mode="mode"
        :rules="traefikHttpRules"
      />
    </div>
    <div class="span-2">
      <LabeledInput
        v-model:value="traefikHttps"
        label-key="cluster.ingress.configurationOptions.traefik.https"
        :mode="mode"
        :rules="traefikHttpsRules"
      />
    </div>
  </div>
  <div
    v-if="ingressSelection === INGRESS_NGINX || ingressSelection === INGRESS_DUAL"
    class="row"
  >
    <div class="span-2 mr-20">
      <LabeledInput
        v-model:value="nginxHttp"
        label-key="cluster.ingress.configurationOptions.nginx.http"
        :mode="mode"
        :rules="nginxHttpRules"
      />
    </div>
    <div class="span-2">
      <LabeledInput
        v-model:value="nginxHttps"
        label-key="cluster.ingress.configurationOptions.nginx.https"
        :mode="mode"
        :rules="nginxHttpsRules"
      />
    </div>
  </div>
</template>
