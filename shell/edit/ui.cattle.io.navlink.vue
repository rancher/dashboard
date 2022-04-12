<script>
import { isNull, isUndefined } from 'lodash';
import CreateEditView from '@shell/mixins/create-edit-view';
import { SERVICE } from '@shell/config/types';
import { PROTOCOLS } from '@shell/config/schema';
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';
import FileImageSelector from '@shell/components/form/FileImageSelector';
import NameNsDescription, { normalizeName } from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

const LINK_TYPE_URL = 'url';
const LINK_TYPE_SERVICE = 'service';
const LINK_TARGET_NAMED = 'LINK_TARGET_NAMED';
const LINK_TARGET_BLANK = '_blank';
const LINK_TARGET_SELF = '_self';

export default {
  mixins:     [CreateEditView],
  components: {
    CruResource,
    LabeledInput,
    RadioGroup,
    NameNsDescription,
    Tabbed,
    Tab,
    FileImageSelector,
    LabeledSelect
  },
  data() {
    return {
      targetOptions:  [
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
      services:         [],
      currentService:   null,
    };
  },
  props:      {
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
  computed:   {
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
          this.$set(this.value.spec, 'toURL', '');
          break;
        case LINK_TYPE_SERVICE:
          delete this.value.spec.toURL;
          this.$set(this.value.spec, 'toService', {});
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
  },
  async fetch() {
    this.services = await this.$store
      .dispatch('cluster/findAll', { type: SERVICE });
  },
  methods:    {
    /**
     * Set the target of the navLink
     * It will assign namedWindow value for named target cases
     * @param {string} value
     */
    setTargetValue(value) {
      switch (value) {
      case LINK_TARGET_SELF:
      case LINK_TARGET_BLANK:
        this.$set(this.value.spec, 'target', value);
        break;
      default:
        this.$set(this.value.spec, 'target', this.targetName);
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
        this.$set(this.value, 'spec', { toURL: '' });
      }
      if (!this.value.metadata) {
        this.$set(this.value, 'metadata', {});
      }
      if (!this.value.spec.target) {
        this.$set(this.value.spec, 'target', LINK_TARGET_BLANK);
      }
    },
    /**
     * Set namespace and name from the selected service
     * @param {label: string, id: string, name: string, namespace: string} service
     */
    setService(service) {
      if (service) {
        const { name, namespace } = service;

        this.$set(this.value.spec.toService, 'name', name);
        this.$set(this.value.spec.toService, 'namespace', namespace);
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
      this.$set(this.value.metadata, 'name', normalizeName(this.value.spec.label));
    },
    /**
     * Get error chained validation based on existing label
     * @param {string} label
     */
    getError(label) {
      return this.$store.getters['i18n/t']('validation.required', { key: this.t(label) });
    },
    /**
     * Verify all fields are fulfilled or display footer notification
     */
    validate() {
      const errors = [];

      switch (this.currentLinkType) {
      case LINK_TYPE_URL:
        if (!this.value.spec.toURL) {
          errors.push(this.getError('navLink.tabs.link.toURL.label'));
        }
        break;

      case LINK_TYPE_SERVICE:
        if (!this.value.spec.toService.name || !this.value.spec.toService.namespace) {
          errors.push(this.getError(`navLink.tabs.link.toService.service.label`));
        }

        if (!this.value.spec.toService.scheme) {
          errors.push(this.getError(`navLink.tabs.link.toService.scheme.label`));
        }
        break;

        // no default
      }

      if (!this.value.metadata.name) {
        errors.push(this.getError('navLink.name.label'));
      }

      if (errors.length) {
        throw (errors.join('\n'));
      }
    },
  },
  created() {
    this.setDefaultValues();
    this.setUrlType();
    this.setTargetOption();
    this.setCurrentService();
    // Validate error presence by allowing or resetting submission process
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.validate);
    }
  }
};
</script>

<template>
  <CruResource
    :can-yaml="!isCreate"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done()"
  >
    <NameNsDescription
      v-model="value"
      :namespaced="false"
      :namespace-disabled="true"
      :mode="mode"
      name-key="metadata.name"
      description-key="spec.label"
      name-label="navLink.name.label"
      name-placeholder="navLink.name.placeholder"
      description-label="navLink.label.label"
      description-placeholder="navLink.label.placeholder"
    />

    <Tabbed
      :side-tabs="true"
    >
      <Tab
        name="link"
        :label="t('navLink.tabs.link.label')"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <RadioGroup
              v-model="linkType"
              name="type"
              :mode="mode"
              :options="urlTypeOptions"
            />
          </div>
        </div>

        <template v-if="isURL">
          <div class="row mb-20">
            <LabeledInput
              v-model="value.spec.toURL"
              :mode="mode"
              :label="t('navLink.tabs.link.toURL.label')"
              :required="isURL"
              :placeholder="t('navLink.tabs.link.toURL.placeholder')"
            />
          </div>
        </template>
        <template v-if="isService">
          <div class="row mb-20">
            <div class="col span-2">
              <LabeledSelect
                v-model="value.spec.toService.scheme"
                :mode="mode"
                :label="t('navLink.tabs.link.toService.scheme.label')"
                :required="isService"
                :options="protocolsOptions"
                :placeholder="t('navLink.tabs.link.toService.scheme.placeholder')"
              />
            </div>
            <div class="col span-5">
              <LabeledSelect
                v-model="currentService"
                :mode="mode"
                :label="t('navLink.tabs.link.toService.service.label')"
                :options="mappedServices"
                :required="isService"
                :placeholder="t('navLink.tabs.link.toService.service.placeholder')"
                @input="setService"
              />
            </div>
            <div class="col span-2">
              <LabeledInput
                v-model="value.spec.toService.port"
                :mode="mode"
                :label="t('navLink.tabs.link.toService.port.label')"
                type="number"
                :placeholder="t('navLink.tabs.link.toService.port.placeholder')"
              />
            </div>
            <div class="col span-3">
              <LabeledInput
                v-model="value.spec.toService.path"
                :mode="mode"
                :label="t('navLink.tabs.link.toService.path.label')"
                :placeholder="t('navLink.tabs.link.toService.path.placeholder')"
              />
            </div>
          </div>
        </template>
      </Tab>

      <Tab
        name="target"
        :label="t('navLink.tabs.target.label')"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <RadioGroup
              v-model="currentTarget"
              name="type"
              :mode="mode"
              :options="targetOptions"
              :required="true"
              @input="setTargetValue($event)"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-if="isNamedWindow"
              v-model="targetName"
              :mode="mode"
              :label="t('navLink.tabs.target.namedValue.label')"
              @input="setTargetValue($event);"
            />
          </div>
        </div>
      </Tab>

      <Tab
        name="group"
        :label="t('navLink.tabs.group.label')"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.group"
              :mode="mode"
              :tooltip="t('navLink.tabs.group.group.tooltip')"
              :label="t('navLink.tabs.group.group.label')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.sideLabel"
              :mode="mode"
              :label="t('navLink.tabs.group.sideLabel.label')"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.description"
              :mode="mode"
              :label="t('navLink.tabs.group.description.label')"
            />
          </div>
          <div class="col span-2">
            <FileImageSelector
              v-model="value.spec.iconSrc"
              :mode="mode"
              :label="t('navLink.tabs.group.iconSrc.label')"
            />
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
