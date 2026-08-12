<script>
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { _EDIT } from '@shell/config/query-params';
import { CHALLENGE_TYPES } from '../../form-options';
import Dns01Provider from './Dns01Provider.vue';

// RadioGroup needs a name that is unique across the page, and solvers are rendered as a list.
let solverCount = 0;

export default {
  name:       'AcmeSolver',
  components: {
    ArrayList, Banner, Dns01Provider, KeyValue, LabeledInput, RadioGroup
  },

  props: {
    /** A single entry of `spec.acme.solvers`, bound into directly. */
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  data() {
    return { radioName: `challengeType-${ solverCount++ }` };
  },

  created() {
    this.value.selector = this.value.selector || {};

    if (!this.value.http01 && !this.value.dns01) {
      this.value.http01 = { ingress: {} };
    }
  },

  computed: {
    challengeTypeOptions() {
      return [
        { label: this.t('certManager.solver.http01'), value: CHALLENGE_TYPES.HTTP01 },
        { label: this.t('certManager.solver.dns01'), value: CHALLENGE_TYPES.DNS01 },
      ];
    },

    challengeType: {
      get() {
        return this.value.dns01 ? CHALLENGE_TYPES.DNS01 : CHALLENGE_TYPES.HTTP01;
      },
      set(neu) {
        // The two are mutually exclusive - cert-manager rejects a solver with both.
        if (neu === CHALLENGE_TYPES.DNS01) {
          delete this.value.http01;
          this.value.dns01 = this.value.dns01 || {};
        } else {
          delete this.value.dns01;
          this.value.http01 = this.value.http01 || { ingress: {} };
        }
      },
    },

    isCatchAll() {
      const { dnsZones = [], dnsNames = [], matchLabels = {} } = this.value.selector || {};

      return !dnsZones.length && !dnsNames.length && !Object.keys(matchLabels).length;
    },
  },
};
</script>

<template>
  <div class="acme-solver">
    <RadioGroup
      v-model:value="challengeType"
      :name="radioName"
      :label="t('certManager.solver.challengeType')"
      :options="challengeTypeOptions"
      :mode="mode"
      class="mb-20"
    />

    <template v-if="challengeType === 'http01'">
      <div
        v-if="value.http01.ingress"
        class="row mb-20"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.http01.ingress.ingressClassName"
            :label="t('certManager.solver.ingressClassName')"
            :tooltip="t('certManager.solver.ingressClassNameTooltip')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.http01.ingress.name"
            :label="t('certManager.solver.existingIngress')"
            :tooltip="t('certManager.solver.existingIngressTooltip')"
            :mode="mode"
          />
        </div>
      </div>
      <Banner
        v-if="value.http01.gatewayHTTPRoute"
        color="info"
        :label="t('certManager.solver.gatewayHttpRoute')"
      />
    </template>

    <Dns01Provider
      v-else
      :value="value.dns01"
      :mode="mode"
    />

    <h3 class="mt-20">
      {{ t('certManager.solver.selector') }}
    </h3>
    <Banner
      v-if="isCatchAll"
      color="info"
      :label="t('certManager.solver.catchAllHelp')"
    />
    <div class="row">
      <div class="col span-6">
        <ArrayList
          v-model:value="value.selector.dnsZones"
          :title="t('certManager.solver.dnsZones')"
          :add-label="t('certManager.solver.addDnsZone')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          v-model:value="value.selector.dnsNames"
          :title="t('certManager.solver.dnsNames')"
          :add-label="t('certManager.solver.addDnsName')"
          :mode="mode"
        />
      </div>
    </div>
    <KeyValue
      v-model:value="value.selector.matchLabels"
      :title="t('certManager.solver.matchLabels')"
      :mode="mode"
      :read-allowed="false"
      class="mt-20"
    />
  </div>
</template>
