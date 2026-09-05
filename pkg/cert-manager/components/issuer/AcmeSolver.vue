<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';
import { useI18n } from '@shell/composables/useI18n';
import { CHALLENGE_TYPES, HTTP01_INGRESS_MODES } from '../../form-options';
import { RadioGroup } from '@components/Form/Radio';
import type { AcmeSolver } from '../../schema';
import Dns01Provider from './Dns01Provider.vue';
import { nextSolverId } from './solver-id';

type IngressMode = typeof HTTP01_INGRESS_MODES[number];

interface Props {
  /** A single entry of `spec.acme.solvers`, bound into directly. */
  value: AcmeSolver;
  mode?: string;
}

const props = withDefaults(defineProps<Props>(), { mode: _EDIT });

const store = useStore();
const { t } = useI18n(store);

const radioName = nextSolverId();

props.value.selector = props.value.selector || {};

if (!props.value.http01 && !props.value.dns01) {
  props.value.http01 = { ingress: {} };
}

const selector = computed(() => props.value.selector as NonNullable<AcmeSolver['selector']>);
const dns01Config = computed(() => props.value.dns01 as Record<string, any>);
const hasIngress = computed(() => !!props.value.http01?.ingress);
const gatewayHttpRoute = computed(() => props.value.http01?.gatewayHTTPRoute);

const challengeTypeOptions = computed(() => [CHALLENGE_TYPES.HTTP01, CHALLENGE_TYPES.DNS01].map((value) => ({
  value,
  label:       t(`certManager.solver.${ value }`),
  // Raw - `RadioButton` interpolates the description as text, so an escaped apostrophe
  // would reach the page as `&#39;`.
  description: t(`certManager.solver.${ value }Description`, undefined, true),
})));

const challengeType = computed<string>({
  get() {
    return props.value.dns01 ? CHALLENGE_TYPES.DNS01 : CHALLENGE_TYPES.HTTP01;
  },
  set(neu) {
    // The two are mutually exclusive - cert-manager rejects a solver with both.
    if (neu === CHALLENGE_TYPES.DNS01) {
      delete props.value.http01;
      props.value.dns01 = props.value.dns01 || {};
    } else {
      delete props.value.dns01;
      props.value.http01 = props.value.http01 || { ingress: {} };
    }
  },
});

const ingressModeOptions = computed(() => HTTP01_INGRESS_MODES.map((value) => ({
  value,
  label:       t(`certManager.solver.ingressMode.${ value }`),
  description: t(`certManager.solver.ingressMode.${ value }Description`, undefined, true),
})));

/**
 * cert-manager allows exactly one of `ingressClassName`, `class` or `name` on an HTTP-01
 * ingress solver and the webhook rejects any combination, so this is a choice rather than
 * three fields. Derived from whichever key is set, so YAML-authored solvers round-trip.
 */
const ingressMode = computed<IngressMode>({
  get() {
    const ingress = props.value.http01?.ingress || {};

    return HTTP01_INGRESS_MODES.find((mode) => ingress[mode] !== undefined) || HTTP01_INGRESS_MODES[0];
  },
  set(neu) {
    const ingress = props.value.http01?.ingress || {};

    HTTP01_INGRESS_MODES.forEach((mode) => delete ingress[mode]);
    ingress[neu] = '';
    props.value.http01!.ingress = ingress;
  },
});

const ingressValue = computed<string | undefined>({
  get() {
    return props.value.http01?.ingress?.[ingressMode.value];
  },
  set(neu) {
    if (props.value.http01?.ingress) {
      props.value.http01.ingress[ingressMode.value] = neu;
    }
  },
});

const isCatchAll = computed(() => {
  const { dnsZones = [], dnsNames = [], matchLabels = {} } = props.value.selector || {};

  return !dnsZones.length && !dnsNames.length && !Object.keys(matchLabels).length;
});

defineExpose({
  radioName, challengeType, challengeTypeOptions, ingressMode, ingressModeOptions, isCatchAll
});
</script>

<template>
  <div class="acme-solver">
    <RadioGroup
      v-model:value="challengeType"
      :name="radioName"
      :label="t('certManager.solver.challengeType')"
      :options="challengeTypeOptions"
      :mode="mode"
      class="mmb-5"
    />

    <template v-if="challengeType === 'http01'">
      <template v-if="hasIngress">
        <RadioGroup
          v-model:value="ingressMode"
          :name="`ingressMode-${ radioName }`"
          :label="t('certManager.solver.ingressMode.label')"
          :options="ingressModeOptions"
          :mode="mode"
          class="mmb-5"
        />

        <div class="row mmb-5">
          <div class="col span-6">
            <LabeledInput
              v-model:value="ingressValue"
              :label="t(`certManager.solver.ingressMode.${ ingressMode }`)"
              :mode="mode"
            />
          </div>
        </div>
      </template>
      <Banner
        v-if="gatewayHttpRoute"
        color="info"
        :label="t('certManager.solver.gatewayHttpRoute')"
      />
    </template>

    <Dns01Provider
      v-else
      :value="dns01Config"
      :mode="mode"
    />

    <h3 class="mmt-5">
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
          v-model:value="selector.dnsZones"
          :title="t('certManager.solver.dnsZones')"
          :add-label="t('certManager.solver.addDnsZone')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          v-model:value="selector.dnsNames"
          :title="t('certManager.solver.dnsNames')"
          :add-label="t('certManager.solver.addDnsName')"
          :mode="mode"
        />
      </div>
    </div>
    <KeyValue
      v-model:value="selector.matchLabels"
      :title="t('certManager.solver.matchLabels')"
      :mode="mode"
      :read-allowed="false"
      class="mmt-5"
    />
  </div>
</template>
