<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { RadioGroup } from '@components/Form/Radio';
import { useI18n } from '@shell/composables/useI18n';
import { ACME_SERVERS, ACME_SERVER_CHOICE } from '../../form-options';
import type { AcmeIssuerConfig } from '../../schema';
import AcmeSolver from './AcmeSolver.vue';

type ServerChoice = typeof ACME_SERVER_CHOICE[keyof typeof ACME_SERVER_CHOICE];

interface Props {
  /** The live `spec.acme` object. */
  value: AcmeIssuerConfig;
  mode?: string;
  /** Secret refs on a ClusterIssuer resolve in cert-manager's own namespace, not the user's. */
  clusterScoped?: boolean;
  /**
   * Validators keyed by field, owned by the parent form. Bound to the inputs rather than
   * checked at the form level so a `required` message waits for the field to be blurred - the
   * ACME defaults leave both of these empty, and a banner on arrival reads as an error the
   * user caused.
   */
  rules?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  mode:          _EDIT,
  clusterScoped: false,
  rules:         () => ({}),
});

const store = useStore();
const { t } = useI18n(store);

props.value.privateKeySecretRef = props.value.privateKeySecretRef || {};
props.value.solvers = props.value.solvers || [];

const serverChoiceOptions = computed(() => Object.values(ACME_SERVER_CHOICE).map((value) => ({
  value,
  label: t(`certManager.issuer.acme.serverChoice.${ value }`),
})));

/** Derived from the URL so an issuer authored in YAML still lands on the right option. */
const serverChoice = computed<ServerChoice>({
  get() {
    if (props.value.server === ACME_SERVERS.PRODUCTION) {
      return ACME_SERVER_CHOICE.PRODUCTION;
    }

    return props.value.server === ACME_SERVERS.STAGING ? ACME_SERVER_CHOICE.STAGING : ACME_SERVER_CHOICE.CUSTOM;
  },
  set(choice) {
    if (choice === ACME_SERVER_CHOICE.PRODUCTION) {
      props.value.server = ACME_SERVERS.PRODUCTION;
    } else if (choice === ACME_SERVER_CHOICE.STAGING) {
      props.value.server = ACME_SERVERS.STAGING;
    } else {
      props.value.server = '';
    }
  },
});

const isCustomServer = computed(() => serverChoice.value === ACME_SERVER_CHOICE.CUSTOM);

const privateKeySecretName = computed<string | undefined>({
  get() {
    return props.value.privateKeySecretRef?.name;
  },
  set(neu) {
    if (!props.value.privateKeySecretRef) {
      props.value.privateKeySecretRef = {};
    }
    props.value.privateKeySecretRef.name = neu;
  },
});

const solvers = computed<any[]>({
  get() {
    return props.value.solvers || [];
  },
  set(neu) {
    props.value.solvers = neu;
  },
});

const secretNamespaceTooltip = computed(() => (props.clusterScoped ? t('certManager.issuer.acme.secretNamespaceCluster') : t('certManager.issuer.acme.secretNamespace')));

defineExpose({
  serverChoice, serverChoiceOptions, isCustomServer
});
</script>

<template>
  <div>
    <RadioGroup
      v-model:value="serverChoice"
      name="acmeServerChoice"
      :label="t('certManager.issuer.acme.server')"
      :options="serverChoiceOptions"
      :mode="mode"
      class="mmb-5"
    />

    <div class="row mmb-5">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.server"
          :label="t('certManager.issuer.acme.serverUrl')"
          :tooltip="t('certManager.issuer.acme.serverTooltip')"
          :mode="mode"
          :disabled="!isCustomServer"
          :rules="rules.server || []"
          required
          data-testid="cert-manager-issuer-acme-server"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.email"
          :label="t('certManager.issuer.acme.email')"
          :tooltip="t('certManager.issuer.acme.emailTooltip')"
          :mode="mode"
        />
      </div>
    </div>

    <div class="row mmb-5">
      <div class="col span-6">
        <LabeledInput
          v-model:value="privateKeySecretName"
          :label="t('certManager.issuer.acme.privateKeySecret')"
          :tooltip="secretNamespaceTooltip"
          :mode="mode"
          :rules="rules.privateKeySecret || []"
          required
          data-testid="cert-manager-issuer-acme-private-key-secret"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.preferredChain"
          :label="t('certManager.issuer.acme.preferredChain')"
          :tooltip="t('certManager.issuer.acme.preferredChainTooltip')"
          :mode="mode"
        />
      </div>
    </div>

    <Checkbox
      v-model:value="value.skipTLSVerify"
      :label="t('certManager.issuer.acme.skipTLSVerify')"
      :mode="mode"
      class="mmb-5"
    />

    <h3>{{ t('certManager.issuer.tab.solvers') }}</h3>
    <Banner
      v-if="!solvers.length"
      color="warning"
      :label="t('certManager.solver.noneWarning')"
    />
    <ArrayListGrouped
      v-model:value="solvers"
      :add-label="t('certManager.solver.add')"
      :default-add-value="{ selector: {}, http01: { ingress: {} } }"
      :mode="mode"
    >
      <template #default="{ row }">
        <AcmeSolver
          :value="row.value"
          :mode="mode"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>
