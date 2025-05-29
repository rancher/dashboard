<script>
import isEmpty from 'lodash/isEmpty';
import { createYamlWithOptions } from '@shell/utils/create-yaml';
import { clone, get } from '@shell/utils/object';
import { SCHEMA, NAMESPACE } from '@shell/config/types';
import ResourceYaml from '@shell/components/ResourceYaml';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { mapGetters, mapState, mapActions } from 'vuex';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import CruResourceFooter from '@shell/components/CruResourceFooter';

import {
  _EDIT, _VIEW, AS, _YAML, _UNFLAG, SUB_TYPE
} from '@shell/config/query-params';

import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import Wizard from '@shell/components/Wizard';

export const CONTEXT_HOOK_EDIT_YAML = 'show-preview-yaml';

export default {

  name: 'CruResource',

  emits: ['select-type', 'error', 'cancel', 'finish'],

  components: {
    AsyncButton,
    Banner,
    CruResourceFooter,
    ResourceYaml,
    Wizard
  },

  props: {
    doneRoute: {
      type:    [String, Object],
      default: null
    },

    cancelEvent: {
      type:    Boolean,
      default: false,
    },

    showCancel: {
      type:    Boolean,
      default: true
    },

    mode: {
      type:     String,
      required: true
    },

    resource: {
      type:     [String, Object],
      required: true
    },

    subtypes: {
      type:    Array,
      default: () => []
    },

    selectedSubtype: {
      type:    String,
      default: null
    },

    validationPassed: {
      type:    Boolean,
      default: true
    },

    errors: {
      type:    Array,
      default: () => []
    },

    /**
     * Set of maps to convert error messages to something more user friendly and apply icons
     */
    errorsMap: {
      type:    Object,
      default: null
    },

    // Is the edit as yaml button allowed
    canYaml: {
      type:    Boolean,
      default: true,
    },

    // Call this function instead of the normal one to convert the resource into yaml to display
    generateYaml: {
      type:    Function,
      default: null,
    },

    // Override the set of labels shown on the button from the default save/create.
    finishButtonMode: {
      type:    String,
      default: null,
    },

    preventEnterSubmit: {
      type:    Boolean,
      default: false,
    },

    applyHooks: {
      type:    Function,
      default: null,
    },

    steps: {
      type:    Array,
      default: () => []
    },

    stepsOptions: {
      type:    Object,
      default: () => ({ editFirstStep: true })
    },

    // The set of labels to display for the finish AsyncButton
    finishMode: {
      type:    String,
      default: 'finish'
    },

    // Used to prevent cancel and create buttons from moving
    // as form validation errors appear and disappear.
    minHeight: {
      type:    String,
      default: ''
    },

    // Location of `namespace` value within the resource. Used when creating the namespace
    namespaceKey: {
      type:    String,
      default: 'metadata.namespace'
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'form'
    },

    description: {
      type:    String,
      default: ''
    },

    yamlModifiers: {
      type:    Object,
      default: undefined
    }
  },

  data(props) {
    const inStore = this.$store.getters['currentStore'](this.resource);
    const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resource.type);

    return {
      isCancelModal:   false,
      showAsForm:      this.$route.query[AS] !== _YAML,
      /**
       * Initialised on demand (given that it needs to make a request to fetch schema definition)
       */
      resourceYaml:    null,
      /**
       * Initialised on demand (given that it needs to make a request to fetch schema definition)
       */
      initialYaml:     null,
      /**
       * Save a copy of the initial resource. This is used to calc the initial yaml later on
       */
      initialResource: clone(this.resource),
      abbrSizes:       {
        3: '24px',
        4: '18px',
        5: '16px',
        6: '14px'
      },
      schema
    };
  },

  computed: {
    canSave() {
      const { validationPassed, showAsForm, steps } = this;

      if (showAsForm && steps?.length) {
        return validationPassed && this.steps.every((step) => step.ready);
      }

      // Don't apply validation rules if the form is not shown.
      if (!this.showAsForm) {
        return true;
      }

      // Disable the save button if there are form validation
      // errors while the user is typing.
      return this.validationPassed;
    },

    canEditYaml() {
      return !(this.schema?.resourceMethods?.includes('blocked-PUT'));
    },

    showYaml() {
      return this.canYaml && (this._selectedSubtype || !this.subtypes.length) && this.canEditYaml && this.mode !== _VIEW;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    _selectedSubtype() {
      if ( this.selectedSubtype ) {
        return this.selectedSubtype;
      }

      return this.$route.query[SUB_TYPE];
    },

    showSubtypeSelection() {
      if (isEmpty(this.subtypes)) {
        return false;
      }

      if (!this._selectedSubtype) {
        return true;
      }

      return false;
    },

    ...mapGetters({ t: 'i18n/t' }),
    ...mapState('cru-resource', ['createNamespace']),
    ...mapActions('cru-resource', ['setCreateNamespace']),

    /**
     * Prevent issues for malformed types injection
     */
    hasErrors() {
      return this.errors?.length && Array.isArray(this.errors);
    },

    /**
     * Replace returned string with new picked value and icon
     */
    mappedErrors() {
      return !this.errors ? {} : this.errorsMap || this.errors.reduce((acc, error) => ({
        ...acc,
        [error]: {
          message: this.formatError(error),
          icon:    null
        }
      }), {});
    },
  },

  created() {
    if ( this._selectedSubtype ) {
      this.$emit('select-type', this._selectedSubtype);
    }
  },

  mounted() {
    this.$store.dispatch('cru-resource/setCreateNamespace', false);
  },

  beforeUnmount() {
    this.$store.dispatch('cru-resource/setCreateNamespace', false);
  },

  methods: {
    stringify,

    confirmCancel(isCancelNotBack = true) {
      if (isCancelNotBack) {
        this.emitOrRoute();
      } else if (!this.showAsForm) {
        this.resourceYaml = null;
        this.showAsForm = true;
        this.$router.applyQuery({ [AS]: _UNFLAG });
      }
    },

    /**
     * Dismiss given error
     */
    closeError(index) {
      const errors = this.errors.filter((_, i) => i !== index);

      this.$emit('error', errors, this.errors[index]);
    },

    emitOrRoute() {
      if ( this.cancelEvent ) {
        this.$emit('cancel');
      } else {
        const { resource = this.resource.type } = this.$route.params;
        const doneOverride = this.resource.doneOverride;
        const doneDefault = {
          name:   this.doneRoute,
          params: { resource }
        };

        this.$router.replace(doneOverride || doneDefault);
      }
    },

    async createResourceYaml(modifiers, resource = this.resource) {
      // Required to populate yaml comments and default values
      await this.schema?.fetchResourceFields();

      if ( typeof this.generateYaml === 'function' ) {
        return this.generateYaml.apply(this, resource);
      } else {
        const inStore = this.$store.getters['currentStore'](resource);
        const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
        const clonedResource = clone(resource);

        const out = createYamlWithOptions(schemas, resource.type, clonedResource, modifiers);

        return out;
      }
    },

    async showPreviewYaml() {
      // Required to populate yaml comments and default values
      await this.schema?.fetchResourceFields();

      if ( this.applyHooks ) {
        try {
          await this.applyHooks(BEFORE_SAVE_HOOKS, CONTEXT_HOOK_EDIT_YAML);
        } catch (e) {
          console.warn('Unable to show yaml: ', e); // eslint-disable-line no-console

          return;
        }
      }

      const resourceYaml = await this.createResourceYaml(this.yamlModifiers);

      this.resourceYaml = resourceYaml;
      this.showAsForm = false;
      this.$router.applyQuery({ [AS]: _YAML });
    },

    selectType(id, event) {
      if (event?.srcElement?.tagName === 'A') {
        return;
      }

      this.$router.applyQuery({ [SUB_TYPE]: id });
      this.$emit('select-type', id);
    },

    async clickSave(buttonDone) {
      try {
        await this.createNamespaceIfNeeded();

        // If the attempt to create the new namespace
        // is successful, save the resource.
        this.$emit('finish', buttonDone);
      } catch (err) {
        // After the attempt to create the namespace,
        // show any applicable errors if the namespace is
        // invalid.
        this.$emit('error', exceptionToErrorsArray(err.message));
        buttonDone(false);
      }
    },

    save() {
      this.$refs.save.clicked();
    },

    async createNamespaceIfNeeded() {
      const inStore = this.$store.getters['currentStore'](this.resource);
      const newNamespaceName = get(this.resource, this.namespaceKey);
      let namespaceAlreadyExists = false;

      if (!this.createNamespace) {
        return;
      }

      try {
        // This is in a try-catch block because the call to fetch
        // a namespace throws an error if the namespace is not found.
        namespaceAlreadyExists = !!(await this.$store.dispatch(`${ inStore }/find`, { type: NAMESPACE, id: newNamespaceName }));
      } catch {}

      if (this.createNamespace && !namespaceAlreadyExists) {
        try {
          const newNamespace = await this.$store.dispatch(`${ inStore }/createNamespace`, { name: newNamespaceName }, { root: true });

          newNamespace.applyDefaults();
          await newNamespace.save();
        } catch (e) {
          // this.errors = exceptionToErrorsArray(e);
          this.$emit('error', exceptionToErrorsArray(e));
          throw new Error(`Could not create the new namespace. ${ e.message }`);
        }
      }
    },

    onPressEnter(event) {
      if (this.preventEnterSubmit) {
        event.preventDefault();
      }
    },

    shouldProvideSlot(slot) {
      return slot !== 'default' && typeof this.$slots[slot] === 'function';
    },

    formatError(err) {
      if ( typeof err === 'string') {
        return err;
      }
      if ( err?.code === 'ActionNotAvailable' ) {
        return this.t('errors.actionNotAvailable');
      }
      const msg = !!err?.message ? err.message : '';
      let messageDetail = '';

      if (!!err?.message && !!err.detail) {
        messageDetail = this.t('errors.messageAndDetail', { message: err.message, detail: err.detail });
      } else if (!!err?.message || !!err.detail) {
        const val = err.message ? err.message : err.detail;

        messageDetail = this.t('errors.messageOrDetail', { val });
      }
      if ( err?.status === 422 ) {
        const name = err?.fieldName;
        const code = err?.code;
        let codeExplanation = '';

        switch ( err?.code ) {
        case 'MissingRequired':
          codeExplanation = this.t('errors.missingRequired'); break;
        case 'NotUnique':
          codeExplanation = this.t('errors.notUnique'); break;
        case 'NotNullable':
          codeExplanation = this.t('errors.notNullable'); break;
        case 'InvalidOption':
          codeExplanation = this.t('errors.invalidOption'); break;
        case 'InvalidCharacters':
          codeExplanation = this.t('errors.invalidCharacters'); break;
        case 'MinLengthExceeded':
          codeExplanation = this.t('errors.minLengthExceeded'); break;
        case 'MaxLengthExceeded':
          codeExplanation = this.t('errors.maxLengthExceeded'); break;
        case 'MinLimitExceeded':
          codeExplanation = this.t('errors.minLimitExceeded'); break;
        case 'MaxLimitExceded':
          codeExplanation = this.t('errors.maxLimitExceded'); break;
        }
        if (!!name) {
          if (!!codeExplanation) {
            if (!!messageDetail) {
              return this.t('errors.failedInApi.withName.withCodeExplanation.withMessageDetail', {
                name, codeExplanation, messageDetail
              });
            }

            return this.t('errors.failedInApi.withName.withCodeExplanation.withoutMessageDetail', { name, codeExplanation });
          }
          if (!!messageDetail) {
            return this.t('errors.failedInApi.withName.withMessageDetail', { name, messageDetail });
          }

          return this.t('errors.failedInApi.withName.withoutAnythingElse', { name });
        } else {
          if (!!messageDetail) {
            if (!!codeExplanation) {
              return this.t('errors.failedInApi.withoutName.withMessageDetail.withCodeExplanation', { codeExplanation, messageDetail });
            }

            return this.t('errors.failedInApi.withoutName.withMessageDetail.withoutCodeExplanation', { messageDetail });
          } else if (!!code) {
            if (!!codeExplanation) {
              return this.t('errors.failedInApi.withoutName.withCode.withCodeExplanation', { code, codeExplanation });
            }

            return this.t('errors.failedInApi.withoutName.withCode.withoutCodeExplanation', { code });
          }

          return this.t('errors.failedInApi.withoutAnything');
        }
      } else if ( err?.status === 404 ) {
        if (!!err?.opt?.url) {
          return this.t('errors.notFound.withUrl', { msg, url: err.opt.url });
        }

        return this.t('errors.notFound.withoutUrl', { msg });
      }

      return messageDetail.length > 0 ? messageDetail : err;
    }
  },

  watch: {
    async showAsForm(neu) {
      if (!neu) {
        // Entering yaml mode
        if (!this.initialYaml) {
          this.initialYaml = await this.createResourceYaml(undefined, this.initialResource);
        }
      }
    }
  }
};
</script>

<template>
  <section class="cru">
    <slot name="noticeBanner" />
    <p
      v-if="description"
      class="description"
    >
      {{ description }}
    </p>
    <component
      :is="(isView? 'div' : 'form')"
      :value="resource"
      data-testid="cru-form"
      class="create-resource-container cru__form"
      @submit.prevent
      @keydown.enter="onPressEnter($event)"
    >
      <div
        v-if="hasErrors"
        id="cru-errors"
        class="cru__errors"
      >
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :data-testid="`error-banner${i}`"
          :label="stringify(mappedErrors[err].message)"
          :icon="mappedErrors[err].icon"
          :closable="true"
          @close="closeError(i)"
        />
      </div>
      <div
        v-if="showSubtypeSelection"
        class="subtypes-container cru__content"
      >
        <slot
          name="subtypes"
          :subtypes="subtypes"
        >
          <div
            v-for="(subtype, i) in subtypes"
            :key="i"
            class="subtype-banner"
            :class="{ selected: subtype.id === _selectedSubtype }"
            :data-testid="`subtype-banner-item-${subtype.id}`"
            tabindex="0"
            :aria-disabled="false"
            :aria-label="subtype.description ? `${subtype.label} - ${subtype.description}` : subtype.label"
            role="link"
            @click="selectType(subtype.id, $event)"
            @keyup.enter.space="selectType(subtype.id, $event)"
          >
            <slot name="subtype-content">
              <div class="subtype-container">
                <div class="subtype-logo">
                  <img
                    v-if="subtype.bannerImage"
                    :src="subtype.bannerImage"
                    :alt="(resource.type ? resource.type + ': ' : '') + (subtype.label || '')"
                  >
                  <div
                    v-else
                    class="round-image"
                  >
                    <div
                      v-if="subtype.bannerAbbrv"
                      class="banner-abbrv"
                    >
                      <span v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                      <span
                        v-else
                        :style="{fontSize: abbrSizes[subtype.bannerAbbrv.length]}"
                      >{{ subtype.bannerAbbrv }}</span>
                    </div>
                    <div v-else>
                      {{ subtype.id.slice(0, 1).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="subtype-body">
                  <div
                    class="title"
                    :class="{'with-description': !!subtype.description}"
                  >
                    <h5>
                      <span
                        v-if="$store.getters['i18n/exists'](subtype.label)"
                        v-clean-html="t(subtype.label)"
                      />
                      <span v-else>{{ subtype.label }}</span>
                    </h5>
                    <a
                      v-if="subtype.docLink"
                      :href="subtype.docLink"
                      target="_blank"
                      rel="noopener nofollow"
                      class="flex-right"
                    >{{ t('generic.moreInfo') }} <i class="icon icon-external-link" /></a>
                  </div>
                  <hr v-if="subtype.description">
                  <div
                    v-if="subtype.description"
                    class="description"
                  >
                    <span
                      v-if="$store.getters['i18n/exists'](subtype.description)"
                      v-clean-html="t(subtype.description, {}, true)"
                    />
                    <span v-else>{{ subtype.description }}</span>
                  </div>
                </div>
              </div>
            </slot>
          </div>
        </slot>
      </div>
      <!------ MULTI STEP PROCESS ------>
      <template v-if="showAsForm && steps.length">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container cru__content cru__content-wizard"
        >
          <Wizard
            v-if="resource"
            ref="Wizard"
            :header-mode="mode"
            :steps="steps"
            :edit-first-step="stepsOptions.editFirstStep"
            :errors="errors"
            :finish-mode="finishMode"
            class="wizard"
            @error="e=>errors = e"
          >
            <template
              #stepContainer="{activeStep}"
              class="step-container"
            >
              <template
                v-for="(step, i) in steps"
                :key="i"
              >
                <div
                  v-if="step.name === activeStep.name || step.hidden"
                  :key="step.name"
                  class="step-container__step"
                  :class="{'hide': step.name !== activeStep.name && step.hidden}"
                >
                  <slot
                    :step="step"
                    :name="step.name"
                  />
                </div>
              </template>
            </template>
            <template #controlsContainer="{showPrevious, next, back, activeStep, canNext, activeStepIndex, visibleSteps}">
              <CruResourceFooter
                class="cru__footer"
                :mode="mode"
                :is-form="showAsForm"
                :show-cancel="showCancel"
                @cancel-confirmed="confirmCancel"
              >
                <!-- Pass down templates provided by the caller -->
                <template
                  v-for="(_, slot) of $slots"
                  #[slot]="scope"
                  :key="slot"
                >
                  <template v-if="shouldProvideSlot(slot)">
                    <slot
                      :name="slot"
                      v-bind="scope"
                    />
                  </template>
                </template>
                <div class="controls-steps">
                  <button
                    v-if="showYaml"
                    type="button"
                    class="btn role-secondary"
                    @click="showPreviewYaml"
                  >
                    <t k="cruResource.previewYaml" />
                  </button>
                  <template
                    v-if="showPrevious"
                    name="back"
                  >
                    <button
                      type="button"
                      class="btn role-secondary"
                      @click="back()"
                    >
                      <t k="wizard.previous" />
                    </button>
                  </template>
                  <template
                    v-if="activeStepIndex === visibleSteps.length-1"
                    name="finish"
                  >
                    <AsyncButton
                      v-if="!showSubtypeSelection && !isView"
                      ref="save"
                      :disabled="!activeStep.ready"
                      :mode="finishButtonMode || mode"
                      @click="$emit('finish', $event)"
                    />
                  </template>
                  <template
                    v-else
                    name="next"
                  >
                    <button
                      :disabled="!canNext"
                      type="button"
                      class="btn role-primary"
                      @click="next()"
                    >
                      <t k="wizard.next" />
                    </button>
                  </template>
                </div>
              </CruResourceFooter>
            </template>
          </Wizard>
        </div>
      </template>
      <!------ SINGLE PROCESS ------>
      <template v-else-if="showAsForm">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container cru__content"
          :style="[minHeight ? { 'min-height': minHeight } : {}]"
        >
          <slot />
        </div>
        <slot name="form-footer">
          <CruResourceFooter
            class="cru__footer"
            :mode="mode"
            :is-form="showAsForm"
            :show-cancel="showCancel"
            :component-testid="componentTestid"
            @cancel-confirmed="confirmCancel"
          >
            <!-- Pass down templates provided by the caller -->
            <template
              v-for="(_, slot) of $slots"
              #[slot]="scope"
              :key="slot"
            >
              <template v-if="shouldProvideSlot(slot)">
                <slot
                  :name="slot"
                  v-bind="scope"
                />
              </template>
            </template>
            <template
              v-if="!isView"
              #default
            >
              <div>
                <button
                  v-if="showYaml"
                  :data-testid="componentTestid + '-yaml'"
                  type="button"
                  class="btn role-secondary"
                  @click="showPreviewYaml"
                >
                  <t k="cruResource.previewYaml" />
                </button>
                <AsyncButton
                  v-if="!showSubtypeSelection"
                  ref="save"
                  :disabled="!canSave"
                  :mode="finishButtonMode || mode"
                  :data-testid="componentTestid + '-save'"
                  @click="clickSave($event)"
                />
              </div>
            </template>
          </CruResourceFooter>
        </slot>
      </template>
      <!------ YAML ------>
      <!-- Hide this section until it's needed. This means we don't need to upfront create initialYaml -->
      <section
        v-else-if="showYaml && !showAsForm"
        class="cru-resource-yaml-container resource-container cru__content"
      >
        <ResourceYaml
          ref="resourceyaml"
          :value="resource"
          :mode="mode"
          :initial-yaml-for-diff="initialYaml"
          :yaml="resourceYaml"
          :offer-preview="isEdit"
          :done-route="doneRoute"
          :done-override="resource.doneOverride"
          :errors="errors"
          :apply-hooks="applyHooks"
          class="resource-container cru__content"
          @error="e=>$emit('error', e)"
        >
          <template #yamlFooter="{yamlSave, showPreview, yamlPreview, yamlUnpreview, canDiff}">
            <slot name="cru-yaml-footer">
              <CruResourceFooter
                class="cru__footer"
                :done-route="doneRoute"
                :mode="mode"
                :is-form="showAsForm"
                @cancel-confirmed="confirmCancel"
              >
                <template #default="{checkCancel}">
                  <div class="controls-middle">
                    <button
                      v-if="showPreview"
                      type="button"
                      class="btn role-secondary"
                      :data-testid="componentTestid + '-yaml-yaml'"
                      @click="yamlUnpreview"
                    >
                      <t k="resourceYaml.buttons.continue" />
                    </button>
                    <button
                      v-if="!showPreview && isEdit"
                      :data-testid="componentTestid + '-yaml-yaml-preview'"
                      :disabled="!canDiff"
                      type="button"
                      class="btn role-secondary"
                      @click="yamlPreview"
                    >
                      <t k="resourceYaml.buttons.diff" />
                    </button>
                  </div>
                  <div
                    v-if="_selectedSubtype || !subtypes.length"
                    class="controls-right"
                  >
                    <button
                      :data-testid="componentTestid + '-yaml-cancel'"
                      type="button"
                      class="btn role-secondary"
                      @click="checkCancel(false)"
                    >
                      <t k="cruResource.backToForm" />
                    </button>
                    <AsyncButton
                      v-if="!showSubtypeSelection"
                      :data-testid="componentTestid + '-yaml-save'"
                      :disabled="!canSave"
                      :action-label="isEdit ? t('generic.save') : t('generic.create')"
                      @click="cb=>yamlSave(cb)"
                    />
                  </div>
                </template>
              </CruResourceFooter>
            </slot>
          </template>
        </ResourceYaml>
      </section>
    </component>
  </section>
</template>

<style lang='scss' scoped>
.cru-resource-yaml-container {
  .resource-yaml {
    .yaml-editor {
      min-height: 100px;
    }
  }
}
.create-resource-container {

  .resource-container {
    display: flex; // Ensures content grows in child CruResources
    flex-direction: column;
  }

  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }

    &:focus-visible {
      @include focus-outline;
    }
  }
}

$logo: 60px;
$logo-space: 100px;

.title {
  margin-top: 20px;

  &.with-description {
    margin-top: 0;
  }
}

.subtype-container {
  position: relative;
  display: flex;
  height: 100%;
};

.subtype-body {
  flex: 1;
  padding: 10px;
}

.subtype-logo {
  align-items: center;
  display: flex;
  justify-content: center;
  min-width: $logo-space;
  min-height: $logo-space;
  overflow: hidden;
  background-color: var(--box-bg);

  img {
    width: $logo - 4px;
    height: $logo - 4px;
    object-fit: contain;
    position: relative;
    top: 2px;
  }
}

form.create-resource-container .cru {
  &__footer {
    // Only show border when the mode is not view
    border-top: var(--header-border-size) solid var(--header-border);
  }
}
.cru {
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  &__form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  &__content {
    flex-grow: 1;
    &-wizard {
      display: flex;
    }
  }

  &__footer {
    right: 0;
    position: sticky;
    bottom: 0;
    background-color: var(--header-bg);

    // Overrides outlet padding
    margin-left: -$space-m;
    margin-right: -$space-m;
    margin-bottom: -$space-m;
    padding: $space-s $space-m;
  }

  &__errors {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--header-bg);
    margin: 10px 0;
  }
}

.description {
  margin-bottom: 15px;
  margin-top: 5px;
}

</style>
