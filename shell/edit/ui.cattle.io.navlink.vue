<script>
import { isNull, isUndefined } from 'lodash';
import CreateEditView from '@shell/mixins/create-edit-view';
import { SERVICE } from '@shell/config/types';
import { PROTOCOLS } from '@shell/config/schema';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import FileImageSelector from '@shell/components/form/FileImageSelector';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { Banner } from '@components/Banner';
import FormValidation from '@shell/mixins/form-validation';
import { normalizeName } from '@shell/utils/kube';

const LINK_TYPE_URL = 'url';
const LINK_TYPE_SERVICE = 'service';
const LINK_TARGET_NAMED = 'LINK_TARGET_NAMED';
const LINK_TARGET_BLANK = '_blank';
const LINK_TARGET_SELF = '_self';

export default {
  emits:        ['update:value.spec.iconSrc ', 'input'],
  mixins:       [CreateEditView, FormValidation],
  inheritAttrs: false,
  components:   {
    CruResource,
    LabeledInput,
    RadioGroup,
    NameNsDescription,
    FileImageSelector,
    LabeledSelect,
    Banner
  },
  data() {
    return {
      targetOptions: [
        {
          value: LINK_TARGET_BLANK,
          label: this.t('navLink.tabs.target.option.blank'),
        },
        {
          value: LINK_TARGET_SELF,
          label: this.t('navLink.tabs.target.option.self'),
        },
        {
          value: LINK_TARGET_NAMED,
          label: this.t('navLink.tabs.target.option.named'),
        }
      ],
      urlTypeOptions: [
        {
          value: LINK_TYPE_URL,
          label: this.t('navLink.tabs.link.type.url')
        },
        {
          value: LINK_TYPE_SERVICE,
          label: this.t('navLink.tabs.link.type.service')
        }
      ],
      currentLinkType:   null,
      targetName:        null,
      currentTarget:     LINK_TARGET_BLANK,
      protocolsOptions:  PROTOCOLS,
      services:          [],
      currentService:    null,
      imageErrorMessage: '',
      fvFormRuleSets:    [
        { path: 'metadata.name', rules: ['nameRequired'] },
        { path: 'spec.toURL', rules: ['urlRequired'] },
        { path: 'spec.toService.namespace', rules: ['serviceNamespaceRequired'] },
        { path: 'spec.toService.scheme', rules: ['serviceSchemeRequired'] }],

    };
  },
  props: {
    value: {
      type:     Object,
      required: true,
      default:  () => {}
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  computed: {
    /**
     * Identify type of navLink and clear model on value change
     */
    linkType: {
      get() {
        return this.currentLinkType;
      },
      set(type) {
        switch (type) {
        case LINK_TYPE_URL:
          delete this.value.spec.toService;
          this.value.spec['toURL'] = '';
          break;
        case LINK_TYPE_SERVICE:
          delete this.value.spec.toURL;
          this.value.spec['toService'] = {};
          break;
        // No default
        }
        this.currentLinkType = type;
      }
    },
    isService() {
      return Boolean(this.value.spec.toService);
    },
    isURL() {
      return !isNull(this.value.spec.toURL) && !isUndefined(this.value.spec.toURL);
    },
    isNamedWindow() {
      return this.currentTarget === LINK_TARGET_NAMED;
    },
    mappedServices() {
      return this.services.map(({ id, metadata: { name, namespace } }) => ({
        label: id, id, name, namespace
      }) );
    },
    imageError() {
      return !!this.imageErrorMessage && !this.value.spec.iconSrc;
    },
    fvExtraRules() {
      const isLinkTypeUrl = this.currentLinkType === LINK_TYPE_URL;
      const isServiceTypeUrl = this.currentLinkType === LINK_TYPE_SERVICE;

      return {
        nameRequired: () => {
          if (!this.value.metadata.name) {
            return this.getError('navLink.name.label');
          }
        },

        urlRequired: () => {
          const condition = this.value.spec.toURL;

          if (isLinkTypeUrl && !condition) {
            return this.getError('navLink.tabs.link.toURL.label');
          }
        },
        serviceNamespaceRequired: () => {
          const condition = this.value.spec.toService.name && this.value.spec.toService.namespace;

          if (isServiceTypeUrl && !condition) {
            return this.getError('navLink.tabs.link.toService.service.label');
          }
        },
        serviceSchemeRequired: () => {
          const condition = this.value.spec.toService.scheme;

          if (isServiceTypeUrl && !condition) {
            return this.getError('navLink.tabs.link.toService.scheme.label');
          }
        }

      };
    }
  },
  async fetch() {
    this.services = await this.$store
      .dispatch('cluster/findAll', { type: SERVICE });
  },
  methods: {
    /**
     * Set the target of the navLink
     * It will assign namedWindow value for named target cases
     * @param {string} value
     */
    setTargetValue(value) {
      switch (value) {
      case LINK_TARGET_SELF:
      case LINK_TARGET_BLANK:
        this.value.spec['target'] = value;
        break;
      default:
        this.value.spec['target'] = this.targetName;
        break;
      }
    },
    /**
     * Identify target option based on value and update UI accordingly
     * Note: Custom target name is not directly bound to the resource
     */
    setTargetOption() {
      const value = this.value.spec.target;

      switch (value) {
      case LINK_TARGET_SELF:
      case LINK_TARGET_BLANK:
        this.currentTarget = value;
        break;
      default:
        this.currentTarget = LINK_TARGET_NAMED;
        this.targetName = value;
        break;
      }
    },
    /**
     * Set URL type based on existing data
     */
    setUrlType() {
      if (this.isURL) {
        this.currentLinkType = LINK_TYPE_URL;
      }
      if (this.isService) {
        this.currentLinkType = LINK_TYPE_SERVICE;
      }
    },
    /**
     * Initialize resource on creation
     */
    setDefaultValues() {
      if (!this.value.spec) {
        // Link to URL is set as default option from the data
        this.value['spec'] = { toURL: '' };
      }
      if (!this.value.metadata) {
        this.value['metadata'] = {};
      }
      if (!this.value.spec.target) {
        this.value.spec['target'] = LINK_TARGET_BLANK;
      }
    },
    /**
     * Set namespace and name from the selected service
     * @param {label: string, id: string, name: string, namespace: string} service
     */
    setService(service) {
      if (service) {
        const { name, namespace } = service;

        this.value.spec.toService['name'] = name;
        this.value.spec.toService['namespace'] = namespace;
      }
    },
    /**
     * Set paired values of namespace and name for the service
     */
    setCurrentService() {
      const name = this.value.spec.toService?.name;
      const namespace = this.value.spec.toService?.namespace;

      if (name && namespace) {
        this.currentService = `${ namespace }/${ name }`;
      }
    },
    /**
     * Generate automatically kebab case for the displayed label
     */
    setName() {
      this.value.metadata['name'] = normalizeName(this.value.spec.label);
    },
    /**
     * Get error chained validation based on existing label
     * @param {string} label
     */
    getError(label) {
      return this.$store.getters['i18n/t']('validation.required', { key: this.t(label) });
    },

    setImageError(e) {
      this.imageErrorMessage = e;
    },
    setIcon(value) {
      this.imageErrorMessage = '';
      this.$emit('update:value.spec.iconSrc ', value);
    }
  },
  created() {
    this.setDefaultValues();
    this.setUrlType();
    this.setTargetOption();
    this.setCurrentService();
  }
};
</script>

<template>
  <CruResource
    :can-yaml="!isCreate"
    :mode="mode"
    :resource="value"
    :errors="fvUnreportedValidationErrors"
    :cancel-event="true"
    :validation-passed="fvFormIsValid"
    data-testid="Navlink-CRU"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done()"
  >
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :namespace-disabled="true"
      :mode="mode"
      name-key="metadata.name"
      description-key="spec.label"
      name-label="navLink.name.label"
      name-placeholder="navLink.name.placeholder"
      description-label="navLink.label.label"
      description-placeholder="navLink.label.placeholder"
      data-testid="Navlink-name-field"
      :rules="{ name: fvGetAndReportPathRules('metadata.name'), namespace: [], description: [] }"
      @update:value="$emit('input', $event)"
    />

    <div class="spacer" />
    <h2 v-t="'navLink.tabs.link.label'" />
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="linkType"
          name="type"
          :mode="mode"
          :options="urlTypeOptions"
          data-testid="Navlink-link-radiogroup"
        />
      </div>
    </div>

    <template v-if="isURL">
      <div class="row mb-20">
        <LabeledInput
          v-model:value="value.spec.toURL"
          :mode="mode"
          :label="t('navLink.tabs.link.toURL.label')"
          :required="isURL"
          :placeholder="t('navLink.tabs.link.toURL.placeholder')"
          :rules="fvGetAndReportPathRules('spec.toURL')"
          data-testid="Navlink-url-field"
        />
      </div>
    </template>
    <template v-if="isService">
      <div class="row mb-20">
        <div class="col span-2">
          <LabeledSelect
            v-model:value="value.spec.toService.scheme"
            :mode="mode"
            :label="t('navLink.tabs.link.toService.scheme.label')"
            :required="isService"
            :options="protocolsOptions"
            :placeholder="t('navLink.tabs.link.toService.scheme.placeholder')"
            :rules="fvGetAndReportPathRules('spec.toService.scheme')"
            data-testid="Navlink-scheme-field"
          />
        </div>
        <div class="col span-5">
          <LabeledSelect
            v-model:value="currentService"
            :mode="mode"
            :label="t('navLink.tabs.link.toService.service.label')"
            :options="mappedServices"
            :required="isService"
            :placeholder="t('navLink.tabs.link.toService.service.placeholder')"
            :rules="fvGetAndReportPathRules('spec.toService.namespace')"
            data-testid="Navlink-currentService-field"
            @update:value="setService"
          />
        </div>
        <div class="col span-2">
          <LabeledInput
            v-model:value="value.spec.toService.port"
            :mode="mode"
            :label="t('navLink.tabs.link.toService.port.label')"
            type="number"
            :placeholder="t('navLink.tabs.link.toService.port.placeholder')"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model:value="value.spec.toService.path"
            :mode="mode"
            :label="t('navLink.tabs.link.toService.path.label')"
            :placeholder="t('navLink.tabs.link.toService.path.placeholder')"
          />
        </div>
      </div>
    </template>
    <div class="spacer" />
    <h2 v-t="'navLink.tabs.target.label'" />
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="currentTarget"
          name="type"
          :mode="mode"
          :options="targetOptions"
          @update:value="setTargetValue($event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-if="isNamedWindow"
          v-model:value="targetName"
          :mode="mode"
          :label="t('navLink.tabs.target.namedValue.label')"
          @update:value="setTargetValue($event);"
        />
      </div>
    </div>
    <div class="spacer" />
    <h2 v-t="'navLink.tabs.group.label'" />

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.group"
          :mode="mode"
          :tooltip="t('navLink.tabs.group.group.tooltip')"
          :label="t('navLink.tabs.group.group.label')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.sideLabel"
          :mode="mode"
          :label="t('navLink.tabs.group.sideLabel.label')"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.description"
          :mode="mode"
          :label="t('navLink.tabs.group.description.label')"
        />
      </div>
    </div>

    <h4 v-t="'navLink.tabs.groupImage.label'" />
    <div class="row">
      <label class="text-label">
        {{ t('navLink.tabs.groupImage.iconSrc.tip', {}, true) }}
      </label>
    </div>
    <div class="row">
      <FileImageSelector
        v-model:value="value.spec.iconSrc"
        :read-as-data-url="true"
        :mode="mode"
        :label="t('navLink.tabs.groupImage.iconSrc.label')"
        accept="image/jpeg,image/png,image/svg+xml"
        @error="setImageError"
        @update:value="setIcon"
      />
    </div>
    <Banner
      v-if="imageError"
      color="error"
    >
      {{ imageErrorMessage }}
    </Banner>
  </CruResource>
</template>
