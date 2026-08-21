<script>
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { RadioGroup } from '@components/Form/Radio';
import { ACME_SERVERS, ACME_SERVER_CHOICE } from '../../form-options';
import AcmeSolver from './AcmeSolver.vue';

export default {
  name:       'AcmeConfig',
  components: {
    AcmeSolver, ArrayListGrouped, Banner, Checkbox, LabeledInput, RadioGroup
  },

  props: {
    /** The live `spec.acme` object. */
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    /** Secret refs on a ClusterIssuer resolve in cert-manager's own namespace, not the user's. */
    clusterScoped: {
      type:    Boolean,
      default: false,
    },
    /**
     * Validators keyed by field, owned by the parent form. Bound to the inputs rather than
     * checked at the form level so a `required` message waits for the field to be blurred - the
     * ACME defaults leave both of these empty, and a banner on arrival reads as an error the
     * user caused.
     */
    rules: {
      type:    Object,
      default: () => ({}),
    },
  },

  created() {
    this.value.privateKeySecretRef = this.value.privateKeySecretRef || {};
    this.value.solvers = this.value.solvers || [];
  },

  computed: {
    serverChoiceOptions() {
      return Object.values(ACME_SERVER_CHOICE).map((value) => ({
        value,
        label: this.t(`certManager.issuer.acme.serverChoice.${ value }`),
      }));
    },

    /** Derived from the URL so an issuer authored in YAML still lands on the right option. */
    serverChoice: {
      get() {
        if (this.value.server === ACME_SERVERS.PRODUCTION) {
          return ACME_SERVER_CHOICE.PRODUCTION;
        }

        return this.value.server === ACME_SERVERS.STAGING ? ACME_SERVER_CHOICE.STAGING : ACME_SERVER_CHOICE.CUSTOM;
      },
      set(choice) {
        if (choice === ACME_SERVER_CHOICE.PRODUCTION) {
          this.value.server = ACME_SERVERS.PRODUCTION;
        } else if (choice === ACME_SERVER_CHOICE.STAGING) {
          this.value.server = ACME_SERVERS.STAGING;
        } else {
          this.value.server = '';
        }
      },
    },

    isCustomServer() {
      return this.serverChoice === ACME_SERVER_CHOICE.CUSTOM;
    },

    secretNamespaceTooltip() {
      return this.clusterScoped ? this.t('certManager.issuer.acme.secretNamespaceCluster') : this.t('certManager.issuer.acme.secretNamespace');
    },
  },
};
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
          v-model:value="value.privateKeySecretRef.name"
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
      v-if="!value.solvers.length"
      color="warning"
      :label="t('certManager.solver.noneWarning')"
    />
    <ArrayListGrouped
      v-model:value="value.solvers"
      :add-label="t('certManager.solver.add')"
      :default-add-value="{ selector: {}, http01: { ingress: {} } }"
      :mode="mode"
    >
      <template #default="props">
        <AcmeSolver
          :value="props.row.value"
          :mode="mode"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>
