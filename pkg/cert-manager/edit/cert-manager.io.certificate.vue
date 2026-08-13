<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import Labels from '@shell/components/form/Labels';
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { _CREATE } from '@shell/config/query-params';
import { CERT_MANAGER } from '../types';
import {
  ISSUER_KINDS, ISSUER_GROUP, KEY_ALGORITHMS, KEY_SIZES, KEY_ENCODINGS, ROTATION_POLICIES, KEY_USAGES,
  CERTIFICATE_DEFAULTS
} from '../form-options';
import DurationInput from '../components/DurationInput.vue';

export default {
  name:         'CertificateEdit',
  emits:        ['input'],
  inheritAttrs: false,

  components: {
    ArrayList,
    Banner,
    Checkbox,
    CruResource,
    DurationInput,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Labels,
    NameNsDescription,
    RadioGroup,
    ResourceLabeledSelect,
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
  },

  data() {
    return {
      // Stop auto-filling secretName from the resource name once the user edits it themselves.
      secretNameTouched: !!this.value.spec?.secretName,
      showCommonName:    !!this.value.spec?.commonName,
      fvFormRuleSets:    [
        {
          path: 'metadata.name', rules: ['required', 'dnsLabel'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.secretName', rules: ['required', 'dnsLabel'], translationKey: 'certManager.certificate.secretName'
        },
        {
          path: 'spec.issuerRef.name', rules: ['required'], translationKey: 'certManager.tableHeaders.issuer'
        },
        { path: 'spec', rules: ['atLeastOneIdentifier'] },
      ],
      // Claim the 'spec' path so CruResource does not raise a page-level error banner for it the
      // moment the form opens. The identifier requirement is surfaced inline instead, and the rule
      // still keeps the Create button disabled until it is satisfied.
      fvReportedValidationPaths: ['spec'],
    };
  },

  created() {
    const spec = this.value.spec || {};

    spec.issuerRef = spec.issuerRef || {};
    spec.issuerRef.kind = spec.issuerRef.kind || ISSUER_KINDS.ISSUER;
    // cert-manager defaults the group, but writing it makes the resulting YAML self-describing.
    spec.issuerRef.group = spec.issuerRef.group || ISSUER_GROUP;
    if (this.isCreate) {
      // Only the private key is defaulted. `duration` and `renewBefore` are deliberately left
      // blank: ACME issuers ignore them entirely, so a prefilled value would be misleading there.
      spec.privateKey = { ...CERTIFICATE_DEFAULTS.privateKey, ...spec.privateKey };
    }

    this.value.spec = spec;
  },

  computed: {
    fvExtraRules() {
      return {
        atLeastOneIdentifier: (spec) => {
          const {
            commonName, dnsNames = [], ipAddresses = [], uris = [], emailAddresses = []
          } = spec || {};
          const identifiers = [commonName, ...dnsNames, ...ipAddresses, ...uris, ...emailAddresses].filter(Boolean);

          return identifiers.length ? undefined : this.t('certManager.certificate.validation.noIdentifiers');
        },
      };
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    issuerKindOptions() {
      return [
        { label: this.t('certManager.certificate.issuerKind.issuer'), value: ISSUER_KINDS.ISSUER },
        { label: this.t('certManager.certificate.issuerKind.clusterIssuer'), value: ISSUER_KINDS.CLUSTER_ISSUER },
      ];
    },

    isClusterIssuer() {
      return this.value.spec.issuerRef.kind === ISSUER_KINDS.CLUSTER_ISSUER;
    },

    issuerResourceType() {
      return this.isClusterIssuer ? CERT_MANAGER.CLUSTER_ISSUER : CERT_MANAGER.ISSUER;
    },

    /**
     * A namespaced Issuer must live alongside the Certificate; ClusterIssuers are global.
     *
     * The resources have to be mapped to `{ label, value }`: LabeledSelect reads `optionLabel`
     * (default `label`) for display and `reduce` unwraps `value`, so handing it raw Steve models
     * renders the whole serialised resource as the option text. `issuerRef.name` is a plain
     * string, so label and value are both the resource name.
     */
    issuerSelectSettings() {
      const namespace = this.value.metadata?.namespace;
      const isClusterIssuer = this.isClusterIssuer;

      const updateResources = (issuers) => issuers
        .filter((issuer) => isClusterIssuer || issuer.metadata?.namespace === namespace)
        .map((issuer) => ({ label: issuer.metadata?.name, value: issuer.metadata?.name }));

      return { updateResources };
    },

    /**
     * An Issuer must live in the same namespace as the Certificate, so picking a namespace with
     * none leaves the dropdown empty. Say why rather than just showing "No options".
     */
    hasNoIssuersInNamespace() {
      if (this.isClusterIssuer) {
        return false;
      }

      const all = this.$store.getters['cluster/all'](CERT_MANAGER.ISSUER) || [];

      return !all.some((issuer) => issuer.metadata?.namespace === this.value.metadata?.namespace);
    },

    hasNoIdentifier() {
      const {
        commonName, dnsNames = [], ipAddresses = [], uris = [], emailAddresses = []
      } = this.value.spec || {};

      return ![commonName, ...dnsNames, ...ipAddresses, ...uris, ...emailAddresses].some(Boolean);
    },

    keyAlgorithm() {
      return this.value.spec.privateKey?.algorithm;
    },

    keySizeOptions() {
      return KEY_SIZES[this.keyAlgorithm] || [];
    },

    keyUsageOptions() {
      return KEY_USAGES;
    },

    keyAlgorithmOptions() {
      return KEY_ALGORITHMS;
    },

    keyEncodingOptions() {
      return KEY_ENCODINGS;
    },

    rotationPolicyOptions() {
      return ROTATION_POLICIES;
    },
  },

  watch: {
    // The issuer picked before the switch no longer exists in the newly selected scope.
    // Skipped when there was no previous kind, which is the initial defaulting in created().
    'value.spec.issuerRef.kind'(neu, old) {
      if (old) {
        this.value.spec.issuerRef.name = undefined;
      }
    },

    // Ed25519 has a single fixed key size, and an RSA size is invalid for ECDSA and vice versa.
    'value.spec.privateKey.algorithm'(neu, old) {
      if (old) {
        this.setPrivateKey('size', undefined);
      }
    },

    'value.metadata.name'(neu) {
      if (this.isCreate && neu && !this.secretNameTouched) {
        this.value.spec.secretName = neu;
      }
    },
  },

  methods: {
    /**
     * `spec.privateKey` and `spec.secretTemplate` are optional and are stripped from the saved
     * resource when empty, so they can be absent when the store rehydrates this model after a
     * save. Writing through these keeps the template from dereferencing a missing object.
     */
    setPrivateKey(key, keyValue) {
      this.value.spec.privateKey = { ...this.value.spec.privateKey, [key]: keyValue };
    },

    setSecretTemplate(key, keyValue) {
      this.value.spec.secretTemplate = { ...this.value.spec.secretTemplate, [key]: keyValue };
    },

    clearCommonName() {
      this.value.spec.commonName = undefined;
      this.showCommonName = false;
    },

    onSecretNameInput() {
      this.secretNameTouched = true;
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
      :rules="{ name: fvGetAndReportPathRules('metadata.name'), namespace: [], description: [] }"
    />

    <Tabbed :side-tabs="true">
      <Tab
        name="basics"
        :label="t('certManager.certificate.tab.basics')"
        :weight="60"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <RadioGroup
              v-model:value="value.spec.issuerRef.kind"
              name="issuerKind"
              :label="t('certManager.certificate.issuerKind.label')"
              :options="issuerKindOptions"
              :mode="mode"
            />
          </div>
        </div>

        <Banner
          v-if="hasNoIssuersInNamespace"
          color="warning"
          :label="t('certManager.certificate.noIssuersInNamespace', { namespace: value.metadata.namespace })"
        />

        <div class="row mb-20">
          <div class="col span-6">
            <ResourceLabeledSelect
              :key="issuerResourceType"
              v-model:value="value.spec.issuerRef.name"
              :resource-type="issuerResourceType"
              :label="t('certManager.tableHeaders.issuer')"
              :mode="mode"
              :rules="fvGetAndReportPathRules('spec.issuerRef.name')"
              :all-resources-settings="issuerSelectSettings"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.secretName"
              :label="t('certManager.certificate.secretName')"
              :tooltip="t('certManager.certificate.secretNameTooltip')"
              :placeholder="t('certManager.certificate.secretNamePlaceholder')"
              :mode="mode"
              :rules="fvGetAndReportPathRules('spec.secretName')"
              required
              @update:value="onSecretNameInput"
            />
          </div>
        </div>

        <Banner
          v-if="hasNoIdentifier"
          color="warning"
          :label="t('certManager.certificate.validation.noIdentifiers')"
        />

        <ArrayList
          v-model:value="value.spec.dnsNames"
          :title="t('certManager.certificate.dnsNames')"
          :add-label="t('certManager.certificate.addDnsName')"
          :mode="mode"
          class="mb-20"
        />

        <!--
          Common name is hidden behind a link: a CN that is not also in dnsNames is rejected by the
          CSR check, and most deployments should simply leave it empty.
        -->
        <h3>{{ t('certManager.certificate.commonName') }}</h3>
        <div
          v-if="showCommonName"
          class="row mb-10"
        >
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.commonName"
              :label="t('certManager.certificate.commonName')"
              :tooltip="t('certManager.certificate.commonNameTooltip')"
              :mode="mode"
            />
          </div>
          <div class="col span-6 mt-10">
            <a
              v-if="!isView"
              href="#"
              @click.prevent="clearCommonName"
            >{{ t('generic.remove') }}</a>
          </div>
        </div>
        <a
          v-else-if="!isView"
          href="#"
          class="mb-10 inline-block"
          @click.prevent="showCommonName = true"
        >{{ t('certManager.certificate.setCommonName') }}</a>
        <p class="text-muted mb-20">
          {{ t('certManager.certificate.commonNameHelp') }}
        </p>

        <ArrayList
          v-model:value="value.spec.ipAddresses"
          :title="t('certManager.certificate.ipAddresses')"
          :add-label="t('certManager.certificate.addIpAddress')"
          :mode="mode"
          class="mb-20"
        />
        <ArrayList
          v-model:value="value.spec.uris"
          :title="t('certManager.certificate.uris')"
          :add-label="t('certManager.certificate.addUri')"
          :mode="mode"
          class="mb-20"
        />
        <ArrayList
          v-model:value="value.spec.emailAddresses"
          :title="t('certManager.certificate.emailAddresses')"
          :add-label="t('certManager.certificate.addEmailAddress')"
          :mode="mode"
        />
      </Tab>

      <Tab
        name="advanced"
        :label="t('certManager.certificate.tab.advanced')"
        :weight="30"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <DurationInput
              v-model:value="value.spec.duration"
              :label="t('certManager.certificate.duration')"
              :tooltip="t('certManager.certificate.durationTooltip')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <DurationInput
              v-model:value="value.spec.renewBefore"
              :label="t('certManager.certificate.renewBefore')"
              :tooltip="t('certManager.certificate.renewBeforeTooltip')"
              :mode="mode"
            />
          </div>
        </div>

        <Checkbox
          v-model:value="value.spec.isCA"
          :label="t('certManager.certificate.isCA')"
          :mode="mode"
          class="mb-20"
        />

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.spec.usages"
              :label="t('certManager.certificate.usages')"
              :options="keyUsageOptions"
              :multiple="true"
              :taggable="true"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value.number="value.spec.revisionHistoryLimit"
              type="number"
              min="1"
              :label="t('certManager.certificate.revisionHistoryLimit')"
              :mode="mode"
            />
          </div>
        </div>

        <h3>{{ t('certManager.certificate.secretTemplate') }}</h3>
        <KeyValue
          :value="value.spec.secretTemplate?.labels"
          :title="t('labels.labels.title')"
          :mode="mode"
          :read-allowed="false"
          class="mb-20"
          @update:value="v => setSecretTemplate('labels', v)"
        />
        <KeyValue
          :value="value.spec.secretTemplate?.annotations"
          :title="t('labels.annotations.title')"
          :mode="mode"
          :read-allowed="false"
          @update:value="v => setSecretTemplate('annotations', v)"
        />

        <h3 class="mt-20">
          {{ t('certManager.certificate.privateKey.label') }}
        </h3>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.privateKey?.algorithm"
              :label="t('certManager.certificate.privateKey.algorithm')"
              :options="keyAlgorithmOptions"
              :mode="mode"
              :clearable="true"
              @update:value="v => setPrivateKey('algorithm', v)"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.privateKey?.size"
              :label="t('certManager.certificate.privateKey.size')"
              :options="keySizeOptions"
              :disabled="!keySizeOptions.length"
              :tooltip="keySizeOptions.length ? undefined : t('certManager.certificate.privateKey.sizeFixed')"
              :mode="mode"
              :clearable="true"
              @update:value="v => setPrivateKey('size', v)"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.privateKey?.encoding"
              :label="t('certManager.certificate.privateKey.encoding')"
              :options="keyEncodingOptions"
              :mode="mode"
              :clearable="true"
              @update:value="v => setPrivateKey('encoding', v)"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.privateKey?.rotationPolicy"
              :label="t('certManager.certificate.privateKey.rotationPolicy')"
              :tooltip="t('certManager.certificate.privateKey.rotationPolicyTooltip')"
              :options="rotationPolicyOptions"
              :mode="mode"
              :clearable="true"
              @update:value="v => setPrivateKey('rotationPolicy', v)"
            />
          </div>
        </div>
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
