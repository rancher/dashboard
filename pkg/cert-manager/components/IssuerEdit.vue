<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Labels from '@shell/components/form/Labels';
import Error from '@shell/components/form/Error';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { ISSUER_CONFIG_TYPES, ISSUER_CONFIG_DEFAULTS, HTTP01_INGRESS_MODES } from '../form-options';
import AcmeConfig from './issuer/AcmeConfig.vue';

/**
 * Shared by the Issuer and ClusterIssuer edit pages - the specs are identical, only the scope
 * differs. Kept as a component rather than a mixin so the template lives in one place.
 */
export default {
  name:         'IssuerEdit',
  inheritAttrs: false,

  components: {
    AcmeConfig,
    Banner,
    CruResource,
    Error,
    LabeledInput,
    Labels,
    NameNsDescription,
    RadioGroup,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'edit',
    },
    clusterScoped: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return {
      // The config blocks are mutually exclusive, so only one set of these deep paths ever
      // resolves. `getAllValues` yields nothing for a path whose parent is absent, which is what
      // keeps the ACME rules from blocking a CA issuer and vice versa.
      fvFormRuleSets: [
        {
          path: 'metadata.name', rules: ['required', 'dnsLabel'], translationKey: 'nameNsDescription.name.label'
        },
        { path: 'spec', rules: ['exactlyOneConfigType', 'acmeSolverShape'] },
        {
          path: 'spec.acme.server', rules: ['required'], translationKey: 'certManager.issuer.acme.serverUrl'
        },
        {
          path: 'spec.acme.privateKeySecretRef.name', rules: ['required'], translationKey: 'certManager.issuer.acme.privateKeySecret'
        },
        {
          path: 'spec.ca.secretName', rules: ['required'], translationKey: 'certManager.issuer.ca.secretName'
        },
      ],
    };
  },

  created() {
    this.value.spec = this.value.spec || {};

    if (!this.configType) {
      this.configType = ISSUER_CONFIG_TYPES[0];
    }
  },

  computed: {
    fvExtraRules() {
      return {
        exactlyOneConfigType: (spec) => {
          const present = ISSUER_CONFIG_TYPES.filter((type) => !!spec?.[type]);

          if (!present.length) {
            return this.t('certManager.issuer.validation.noConfigType');
          }

          if (present.length > 1) {
            return this.t('certManager.issuer.validation.multipleConfigTypes', { types: present.join(', ') });
          }

          return undefined;
        },

        acmeSolverShape: (spec) => {
          const solvers = spec?.acme?.solvers || [];
          const invalid = solvers.some((solver) => !!solver.http01 === !!solver.dns01);

          if (invalid) {
            return this.t('certManager.issuer.validation.solverChallengeType');
          }

          const noProvider = solvers.some((solver) => solver.dns01 && !Object.keys(solver.dns01).length);

          if (noProvider) {
            return this.t('certManager.issuer.validation.solverProvider');
          }

          // The form offers these as a choice, but a solver authored in YAML can still set more
          // than one, and the webhook error for it is not self explanatory.
          const ambiguousIngress = solvers.some((solver) => {
            const ingress = solver.http01?.ingress || {};

            return HTTP01_INGRESS_MODES.filter((mode) => !!ingress[mode]).length > 1;
          });

          return ambiguousIngress ? this.t('certManager.issuer.validation.solverIngress') : undefined;
        },
      };
    },

    configTypeOptions() {
      return ISSUER_CONFIG_TYPES.map((value) => ({
        value,
        label:       this.t(`certManager.issuer.type.${ value }`),
        // Raw, because `RadioButton` interpolates the description as text while it renders the
        // label as HTML. Escaped here as well, "Let's Encrypt" would reach the page as
        // "Let&#39;s Encrypt" - Vue escapes the interpolation on its own.
        description: this.t(`certManager.issuer.typeDescription.${ value }`, undefined, true),
      }));
    },

    configType: {
      get() {
        return ISSUER_CONFIG_TYPES.find((type) => !!this.value.spec?.[type]);
      },
      set(neu) {
        // Exactly one config block may be present, so drop the previous one entirely.
        ISSUER_CONFIG_TYPES.forEach((type) => delete this.value.spec[type]);
        this.value.spec[neu] = ISSUER_CONFIG_DEFAULTS[neu]();
      },
    },

    /** Vault and Venafi have deep auth configs that are not modelled here - see the banner. */
    isUnsupportedConfigType() {
      return this.configType === 'vault' || this.configType === 'venafi';
    },
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
    @error="e => errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :namespaced="!clusterScoped"
      :rules="{ name: fvGetAndReportPathRules('metadata.name'), namespace: [], description: [] }"
    />

    <Error
      :value="value.spec"
      :rules="fvGetAndReportPathRules('spec')"
      as-banner
    />

    <Tabbed :side-tabs="true">
      <Tab
        name="configuration"
        :label="t('certManager.issuer.tab.configuration')"
        :weight="30"
      >
        <RadioGroup
          v-model:value="configType"
          name="issuerConfigType"
          :label="t('certManager.issuer.typeLabel')"
          :options="configTypeOptions"
          :mode="mode"
          class="mmb-5"
        />

        <Banner
          v-if="configType === 'selfSigned'"
          color="info"
          :label="t('certManager.issuer.selfSignedHelp')"
        />

        <div
          v-else-if="configType === 'ca'"
          class="row"
        >
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.ca.secretName"
              :label="t('certManager.issuer.ca.secretName')"
              :tooltip="t('certManager.issuer.ca.secretNameTooltip')"
              :mode="mode"
              :rules="fvGetAndReportPathRules('spec.ca.secretName')"
              required
            />
          </div>
        </div>

        <AcmeConfig
          v-else-if="configType === 'acme'"
          :value="value.spec.acme"
          :mode="mode"
          :cluster-scoped="clusterScoped"
          :rules="{
            server: fvGetAndReportPathRules('spec.acme.server'),
            privateKeySecret: fvGetAndReportPathRules('spec.acme.privateKeySecretRef.name'),
          }"
        />

        <Banner
          v-else-if="isUnsupportedConfigType"
          color="info"
          :label="t('certManager.issuer.editAsYaml', { type: t(`certManager.issuer.type.${ configType }`) })"
        />
      </Tab>

      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="10"
      >
        <Labels
          :value="value"
          :mode="mode"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
