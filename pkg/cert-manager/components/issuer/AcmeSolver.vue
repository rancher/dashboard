<script>
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';
import { CHALLENGE_TYPES, HTTP01_INGRESS_MODES } from '../../form-options';
import { RadioGroup } from '@components/Form/Radio';
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
      return [CHALLENGE_TYPES.HTTP01, CHALLENGE_TYPES.DNS01].map((value) => ({
        value,
        label:       this.t(`certManager.solver.${ value }`),
        // Raw - `RadioButton` interpolates the description as text, so an escaped apostrophe
        // would reach the page as `&#39;`.
        description: this.t(`certManager.solver.${ value }Description`, undefined, true),
      }));
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

    ingressModeOptions() {
      return HTTP01_INGRESS_MODES.map((value) => ({
        value,
        label:       this.t(`certManager.solver.ingressMode.${ value }`),
        description: this.t(`certManager.solver.ingressMode.${ value }Description`, undefined, true),
      }));
    },

    /**
     * cert-manager allows exactly one of `ingressClassName`, `class` or `name` on an HTTP-01
     * ingress solver and the webhook rejects any combination, so this is a choice rather than
     * three fields. Derived from whichever key is set, so YAML-authored solvers round-trip.
     */
    ingressMode: {
      get() {
        const ingress = this.value.http01?.ingress || {};

        return HTTP01_INGRESS_MODES.find((mode) => ingress[mode] !== undefined) || HTTP01_INGRESS_MODES[0];
      },
      set(neu) {
        const ingress = this.value.http01.ingress || {};

        HTTP01_INGRESS_MODES.forEach((mode) => delete ingress[mode]);
        ingress[neu] = '';
        this.value.http01.ingress = ingress;
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
      <template v-if="value.http01.ingress">
        <RadioGroup
          v-model:value="ingressMode"
          :name="`ingressMode-${ radioName }`"
          :label="t('certManager.solver.ingressMode.label')"
          :options="ingressModeOptions"
          :mode="mode"
          class="mb-20"
        />

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              :value="value.http01.ingress[ingressMode]"
              :label="t(`certManager.solver.ingressMode.${ ingressMode }`)"
              :mode="mode"
              @update:value="v => value.http01.ingress[ingressMode] = v"
            />
          </div>
        </div>
      </template>
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
