<script>
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { WELL_KNOWN_ACME_SERVERS } from '../../form-options';
import AcmeSolver from './AcmeSolver.vue';

export default {
  name:       'AcmeConfig',
  components: {
    AcmeSolver, ArrayListGrouped, Banner, Checkbox, LabeledInput, LabeledSelect
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
  },

  created() {
    this.value.privateKeySecretRef = this.value.privateKeySecretRef || {};
    this.value.solvers = this.value.solvers || [];
  },

  computed: {
    serverOptions() {
      return WELL_KNOWN_ACME_SERVERS;
    },

    secretNamespaceTooltip() {
      return this.clusterScoped ? this.t('certManager.issuer.acme.secretNamespaceCluster') : this.t('certManager.issuer.acme.secretNamespace');
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.server"
          :label="t('certManager.issuer.acme.server')"
          :tooltip="t('certManager.issuer.acme.serverTooltip')"
          :options="serverOptions"
          :taggable="true"
          :mode="mode"
          required
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

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.privateKeySecretRef.name"
          :label="t('certManager.issuer.acme.privateKeySecret')"
          :tooltip="secretNamespaceTooltip"
          :mode="mode"
          required
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
      class="mb-20"
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
